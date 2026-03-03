import socket, ssl, asyncio, httpx
from typing import Optional

async def resolve_domain(domain: str) -> Optional[str]:
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, socket.gethostbyname, domain)
    except Exception:
        return None

def extract_tls_info(domain: str, port: int = 443) -> dict:
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, port), timeout=4) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert   = ssock.getpeercert()
                version = ssock.version()
                cipher  = ssock.cipher()
                subject = dict(x[0] for x in cert.get("subject", []))
                san     = [v for _, v in cert.get("subjectAltName", []) if isinstance(v, str)]
                return {
                    "tls_version": version,
                    "cipher":      cipher[0] if cipher else None,
                    "common_name": subject.get("commonName"),
                    "san":         san[:6],
                    "not_after":   cert.get("notAfter"),
                }
    except Exception as e:
        return {"error": str(e)}

async def geolocate(ip: str) -> dict:
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,city,country,lat,lon,org,isp"}
            )
            data = r.json()
            if data.get("status") == "success":
                return {
                    "ip":      ip,
                    "city":    data.get("city",    "Unknown"),
                    "country": data.get("country", "Unknown"),
                    "lat":     float(data.get("lat", 0)),
                    "lon":     float(data.get("lon", 0)),
                    "org":     data.get("org") or data.get("isp", "Unknown"),
                }
    except Exception:
        pass
    return {"ip": ip, "city": "Unknown", "country": "Unknown", "lat": 0.0, "lon": 0.0, "org": "Unknown"}