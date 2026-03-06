from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx, json, os

router = APIRouter()

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL          = os.getenv("OPENROUTER_MODEL", "google/gemini-flash-1.5")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


class ExplainRequest(BaseModel):
    domain: str
    staticData: dict
    liveCapture: dict | None = None


def build_prompt(req: ExplainRequest) -> str:
    sd   = req.staticData
    lc   = req.liveCapture
    dns  = sd.get("dns", {})
    tls  = sd.get("tls", {})
    http = sd.get("http", {})
    ip   = sd.get("ip_intel", {})
    auth = (lc or {}).get("authState", {})

    chunks       = (lc or {}).get("chunks", []) or []
    video_chunks = [c for c in chunks if c.get("type") == "video"]
    audio_chunks = [c for c in chunks if c.get("type") == "audio"]
    resp_packets = (lc or {}).get("responsePackets", []) or []
    api_calls    = (lc or {}).get("apiCalls", []) or []
    status_codes = (lc or {}).get("statusCodes", {}) or {}
    req_count    = (lc or {}).get("requestCount", 0)

    domain_lower = req.domain.lower()
    is_youtube   = any(x in domain_lower for x in ["youtube", "youtu.be", "googlevideo"])
    is_netflix   = "netflix" in domain_lower
    is_spotify   = "spotify" in domain_lower
    is_instagram = "instagram" in domain_lower
    is_streaming = is_youtube or is_netflix or is_spotify
    is_api       = any(x in domain_lower for x in ["/api/", "api.", "graphql"])
    has_media    = len(video_chunks) > 0 or len(audio_chunks) > 0

    dns_records    = dns.get("records", {}) or {}
    sec_headers    = http.get("security_headers", {}) or {}
    cdn_info       = http.get("cdn", {}) or {}
    redirect_chain = http.get("redirect_chain", []) or []

    # ── Captured data block ────────────────────────────────────────────────
    data_block = f"""TARGET DOMAIN: {req.domain}

=== DNS ===
resolved_ip: {dns.get('resolved_ip', 'not captured')}
ttl_seconds: {dns.get('ttl', 'not captured')}
nameservers: {', '.join(dns_records.get('NS', [])[:3]) or 'not captured'}
ipv6: {', '.join(dns_records.get('AAAA', [])[:2]) or 'none'}
a_records: {', '.join(dns_records.get('A', [])[:4]) or 'not captured'}

=== TCP / TLS ===
tcp_rtt_ms: {tls.get('tcp_rtt_ms', 'not captured')}
tls_version: {tls.get('tls_version', 'not captured')}
cipher_suite: {tls.get('cipher_suite', 'not captured')}
cipher_bits: {tls.get('cipher_bits', 'not captured')}
certificate_issuer: {tls.get('issuer_org', 'not captured')}
certificate_expires: {tls.get('valid_until', 'not captured')}
san_domains: {tls.get('san_count', 'not captured')}

=== IP GEOLOCATION ===
server_ip: {ip.get('query', 'not captured')}
city: {ip.get('city', 'not captured')}
country: {ip.get('country', 'not captured')}
isp: {ip.get('isp', 'not captured')}
asn: {ip.get('as', 'not captured')}
is_datacenter: {ip.get('hosting', 'not captured')}

=== HTTP ===
status_code: {http.get('status_code', 'not captured')}
response_time_ms: {http.get('response_time_ms', 'not captured')}
protocol: {http.get('protocol', 'not captured')}
server: {http.get('server', 'not captured')}
content_type: {http.get('content_type', 'not captured')}
cdn_name: {cdn_info.get('name', 'none')}
cdn_evidence: {cdn_info.get('evidence', 'none')}
redirects: {' -> '.join([str(r.get('status')) for r in redirect_chain]) or 'none'}

=== SECURITY HEADERS ===
hsts: {sec_headers.get('hsts', False)}
csp: {sec_headers.get('csp', False)}
x_frame_options: {sec_headers.get('x_frame', False)}
x_content_type: {sec_headers.get('x_content_type', False)}
referrer_policy: {sec_headers.get('referrer_policy', False)}"""

    if lc:
        data_block += f"""

=== LIVE CAPTURE ===
is_authenticated: {auth.get('isAuthenticated', False)}
auth_method: {auth.get('authType', 'none')}
session_cookies: {len(auth.get('cookies', []) or [])}
auth_tokens: {len(auth.get('tokens', []) or [])}
total_requests: {req_count}
total_responses: {len(resp_packets)}
api_xhr_calls: {len(api_calls)}
status_distribution: {json.dumps(status_codes)}
video_segments: {len(video_chunks)}
audio_segments: {len(audio_chunks)}"""
        if video_chunks:
            data_block += f"\nsample_video_ranges: {[c.get('range','?') for c in video_chunks[:3]]}"
        if audio_chunks:
            data_block += f"\nsample_audio_ranges: {[c.get('range','?') for c in audio_chunks[:3]]}"
        if api_calls:
            top = [f"{c.get('method','?')} {c.get('path','?')}" for c in api_calls[:5]]
            data_block += f"\ntop_api_calls: {top}"

    # ── Platform-specific context ──────────────────────────────────────────
    platform_ctx = ""
    if is_youtube and has_media:
        platform_ctx = """
PLATFORM: YouTube is active. In Step 10, you MUST explain:
- DASH streaming: video and audio are SEPARATE streams fetched independently
- Each segment is a few seconds, fetched via HTTP Range requests
- The player buffers ahead and switches quality (adaptive bitrate)
- googlevideo.com CDN delivers raw media; youtube.com handles API/metadata
- Why there are dozens of 204 status codes (heartbeat/stats pings to Google servers)
- The video_segments and audio_segments captured are real DASH chunks
"""
    elif is_netflix:
        platform_ctx = """
PLATFORM: Netflix. In Step 10, explain:
- Open Connect CDN: Netflix pre-positions content inside ISP networks
- DASH/CMAF adaptive streaming with separate video+audio tracks
- Why latency is ultra-low: content is often already in your ISP's datacenter
"""
    elif is_spotify:
        platform_ctx = """
PLATFORM: Spotify. In Step 10, explain:
- Vorbis/AAC audio chunks fetched via CDN
- Spotify uses both their own infrastructure and Google Cloud
- Why audio quality switches based on connection speed
"""
    elif is_api:
        platform_ctx = """
PLATFORM: API endpoint. Focus Step 7 on the request/response cycle, REST vs GraphQL,
authentication headers, rate limiting, and the significance of HTTP methods seen.
"""

    return f"""You are a world-class computer networking professor giving a live, real-time classroom explanation.
A student has just traced a real network request to {req.domain} and captured this data.
Your job: narrate the COMPLETE journey of this request through the internet in exactly 10 steps.

{platform_ctx}

REAL CAPTURED DATA — bold every actual captured value with **value**, never invent numbers:
{data_block}

CRITICAL FORMAT — use EXACTLY these markers, one per line, nothing before the bracket:

[STEP 1: USER ACTION — BROWSER PARSING]
[STEP 2: DNS RESOLUTION — NAME TO IP]
[STEP 3: TCP CONNECTION — 3-WAY HANDSHAKE]
[STEP 4: TLS HANDSHAKE — ENCRYPTION NEGOTIATION]
[STEP 5: HTTP REQUEST — WHAT THE BROWSER SENDS]
[STEP 6: CDN & LOAD BALANCER — ROUTING TO EDGE]
[STEP 7: BACKEND INFRASTRUCTURE — INSIDE THE SERVER]
[STEP 8: DATA TRANSMISSION — PACKETS BACK TO YOU]
[STEP 9: BROWSER RENDERING — PAGE CONSTRUCTION]
[STEP 10: STREAMING & ADVANCED PROTOCOLS]
[VERDICT]

For each step write 60-90 words. Bold all real captured values with **value**. Use short ASCII diagrams.

Step guidance:
1. URL parsing, HSTS preload, browser DNS cache. Show URL structure breakdown.
2. DNS chain: Browser Cache → OS → Router → ISP DNS → Root NS → TLD → Authoritative. Use captured IP and TTL. Explain Anycast.
3. TCP handshake diagram (SYN → SYN-ACK → ACK). Use captured RTT to explain physical distance. Explain ports and seq numbers.
4. TLS negotiation: ClientHello → ServerHello → Certificate → Key Exchange → Session Keys. Use all captured TLS values. Explain cipher suite components and PFS.
5. Show real HTTP request headers for the domain. Explain the protocol used, HTTP/2 multiplexing vs HTTP/3 QUIC.
6. CDN edge routing: how DNS returned a POP not the origin. Use captured CDN name, city, ASN, response time. Show browser→ISP→IXP→CDN Edge→Origin diagram.
7. Inside the server: load balancer → API gateway → microservices → cache/DB. Kubernetes, gRPC, Redis. Show internal request flow diagram.
8. TCP packetization: MTU 1500 bytes, seq/ACK, congestion control (BBR/CUBIC), retransmission. Use captured status code.
9. Browser rendering: HTML→DOM→CSSOM→RenderTree→Layout→Paint→Composite. Critical path, JS blocking, progressive loading.
10. {'DASH adaptive streaming: separate video+audio HTTP Range chunks, quality switching algorithm, buffering logic.' if is_streaming else 'QUIC vs TCP, HTTP/3 0-RTT resumption, connection coalescing, latency reduction.'}

[VERDICT]: 2 sentences. Grade connection quality. One unexpected insight from this trace.

TONE: Professor narrating live Wireshark to students. Present tense. Technical but story-driven."""


async def stream_openrouter(prompt: str):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://dpi-engine.vercel.app",
        "X-Title": "DPI Engine Network Tracer",
    }
    body = {
        "model": MODEL,
        "stream": True,
        "max_tokens": 4000,
        "temperature": 0.35,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", OPENROUTER_URL, headers=headers, json=body) as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = line[6:]
                if chunk.strip() == "[DONE]":
                    break
                try:
                    delta = json.loads(chunk)["choices"][0]["delta"].get("content", "")
                    if delta:
                        yield f"data: {json.dumps({'t': delta})}\n\n"
                except Exception:
                    continue


@router.post("/explain")
async def explain(req: ExplainRequest):
    if not OPENROUTER_KEY:
        from fastapi import HTTPException
        raise HTTPException(500, "OPENROUTER_API_KEY not configured")
    prompt = build_prompt(req)
    return StreamingResponse(
        stream_openrouter(prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )