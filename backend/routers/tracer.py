from fastapi import APIRouter, HTTPException, Query
import httpx, ssl, socket, time, asyncio
from urllib.parse import urlparse

router = APIRouter()

def extract_domain(target: str) -> str:
    t = target.strip()
    if not t.startswith("http"):
        t = "https://" + t
    parsed = urlparse(t)
    host = parsed.netloc or parsed.path
    return host.split(":")[0].replace("www.", "")

def detect_cdn(headers: dict) -> dict:
    h = {k.lower(): v for k, v in headers.items()}
    if h.get("cf-ray"):
        return {"name": "Cloudflare", "evidence": f'CF-Ray: {h["cf-ray"]}'}
    if h.get("x-amz-cf-id"):
        return {"name": "AWS CloudFront", "evidence": "x-amz-cf-id header"}
    server = h.get("server", "").lower()
    if server in ("gws", "esf", "sffe") or "x-goog" in str(h):
        return {"name": "Google Global Cache", "evidence": f'Server: {h.get("server","")}'}
    if h.get("x-served-by") or "fastly" in str(h):
        return {"name": "Fastly", "evidence": "x-served-by header"}
    if "akamai" in server or h.get("x-check-cacheable"):
        return {"name": "Akamai", "evidence": "AkamaiGHost"}
    if h.get("x-azure-ref"):
        return {"name": "Azure CDN", "evidence": "x-azure-ref"}
    if h.get("x-cache") and "HIT" in h.get("x-cache", ""):
        return {"name": "Generic CDN", "evidence": f'X-Cache: {h["x-cache"]}'}
    return {"name": "Direct / Unknown", "evidence": "No CDN headers detected"}

def get_tls_info(domain: str) -> dict:
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=6) as sock:
            t0 = time.time()
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                rtt = round((time.time() - t0) * 1000, 2)
                cert   = ssock.getpeercert()
                cipher = ssock.cipher()
                issuer  = dict(x[0] for x in cert.get("issuer", []))
                sans    = [v for t, v in cert.get("subjectAltName", []) if t == "DNS"]
                return {
                    "success":      True,
                    "tls_version":  ssock.version(),
                    "cipher_suite": cipher[0] if cipher else "unknown",
                    "cipher_bits":  cipher[2] if cipher else 0,
                    "issuer_org":   issuer.get("organizationName", "Unknown"),
                    "valid_from":   cert.get("notBefore", ""),
                    "valid_until":  cert.get("notAfter", ""),
                    "san_count":    len(sans),
                    "tcp_rtt_ms":   rtt,
                }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_dns_info(domain: str) -> dict:
    try:
        import dns.resolver
        result = {"success": True, "records": {}}
        try:
            ans = dns.resolver.resolve(domain, "A")
            result["records"]["A"]  = [r.address for r in ans]
            result["resolved_ip"]   = result["records"]["A"][0]
            result["ttl"]           = ans.rrset.ttl
        except Exception:
            ip = socket.gethostbyname(domain)
            result["records"]["A"] = [ip]
            result["resolved_ip"]  = ip
            result["ttl"]          = None
        try:
            result["records"]["NS"] = [str(r) for r in dns.resolver.resolve(domain, "NS")]
        except Exception:
            result["records"]["NS"] = []
        try:
            result["records"]["AAAA"] = [r.address for r in dns.resolver.resolve(domain, "AAAA")]
        except Exception:
            result["records"]["AAAA"] = []
        return result
    except Exception:
        try:
            ip = socket.gethostbyname(domain)
            return {"success": True, "resolved_ip": ip, "records": {"A": [ip], "NS": [], "AAAA": []}, "ttl": None}
        except Exception as e:
            return {"success": False, "error": str(e)}

async def get_http_info(domain: str) -> dict:
    target = f"https://{domain}"
    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=8, follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (compatible; DPIEngine/2.0)"}) as client:
            r = await client.head(target)
        elapsed = round((time.time() - t0) * 1000, 2)
        headers_dict = dict(r.headers)
        cdn = detect_cdn(headers_dict)
        security = {
            "hsts":          "strict-transport-security" in r.headers,
            "csp":           "content-security-policy" in r.headers,
            "x_frame":       "x-frame-options" in r.headers,
            "x_content_type":"x-content-type-options" in r.headers,
            "referrer_policy":"referrer-policy" in r.headers,
        }
        redirect_chain = [{"status": rr.status_code, "url": str(rr.url)} for rr in r.history]
        set_cookies = []
        for k, v in headers_dict.items():
            if k.lower() == "set-cookie":
                flags = []
                if "httponly" in v.lower(): flags.append("HttpOnly")
                if re_secure(v):            flags.append("Secure")
                ss = __import__("re").search(r"samesite=(\w+)", v, __import__("re").I)
                if ss: flags.append(f"SameSite={ss.group(1)}")
                set_cookies.append({"name": v.split("=")[0].strip(), "flags": flags})
        return {
            "success":          True,
            "status_code":      r.status_code,
            "response_time_ms": elapsed,
            "protocol":         "HTTP/2" if r.http_version == "HTTP/2" else r.http_version,
            "server":           r.headers.get("server", "hidden"),
            "content_type":     r.headers.get("content-type", ""),
            "cdn":              cdn,
            "security_headers": security,
            "redirect_chain":   redirect_chain,
            "cookies_set":      set_cookies,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def re_secure(val):
    import re
    return bool(re.search(r";\s*secure", val, re.I))

async def get_ip_intel(ip: str) -> dict:
    try:
        FIELDS = "status,country,countryCode,region,regionName,city,lat,lon,isp,org,as,asname,hosting,proxy,query"
        async with httpx.AsyncClient(timeout=6) as client:
            r = await client.get(f"http://ip-api.com/json/{ip}", params={"fields": FIELDS})
            data = r.json()
        if data.get("status") == "success":
            return {"success": True, **data}
        return {"success": False}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ── Main endpoint — accepts target as query param to avoid encoding issues ────
@router.get("/trace")
async def trace_domain(target: str = Query(...)):
    domain = extract_domain(target)
    if not domain:
        raise HTTPException(400, detail="Invalid domain or URL")

    dns_task  = asyncio.to_thread(get_dns_info, domain)
    tls_task  = asyncio.to_thread(get_tls_info, domain)
    http_task = get_http_info(domain)

    dns_info, tls_info, http_info = await asyncio.gather(dns_task, tls_task, http_task)

    ip_intel = {}
    resolved_ip = dns_info.get("resolved_ip")
    if resolved_ip:
        ip_intel = await get_ip_intel(resolved_ip)

    return {
        "domain":      domain,
        "target":      target,
        "dns":         dns_info,
        "tls":         tls_info,
        "http":        http_info,
        "ip_intel":    ip_intel,
        "resolved_ip": resolved_ip,
        "summary": {
            "cdn":             http_info.get("cdn", {}).get("name", "Unknown") if http_info.get("success") else "Unknown",
            "tls_version":     tls_info.get("tls_version", "Unknown")          if tls_info.get("success") else "Unknown",
            "status_code":     http_info.get("status_code")                    if http_info.get("success") else None,
            "response_time_ms":http_info.get("response_time_ms")               if http_info.get("success") else None,
            "location":        f'{ip_intel.get("city","")}, {ip_intel.get("country","")}' if ip_intel.get("success") else "Unknown",
            "asn":             ip_intel.get("as", "Unknown")                   if ip_intel.get("success") else "Unknown",
        }
    }