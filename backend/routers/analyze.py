from fastapi import APIRouter
from models.schemas import AnalyzeRequest, AnalyzeResponse, FlowResult, ServerInfo
from core.hash_util import hash_five_tuple
from core.load_balancer import LoadBalancer
from core.fast_path import FastPath
from core.probe import resolve_domain, extract_tls_info
import random, asyncio

router = APIRouter()

APP_SIGNATURES = {
    "youtube":    ["youtube.com","googlevideo.com","ytimg.com"],
    "tiktok":     ["tiktok.com","tiktokcdn.com","tiktokv.com"],
    "instagram":  ["instagram.com","cdninstagram.com","fbcdn.net"],
    "facebook":   ["facebook.com","fb.com","fbsbx.com"],
    "netflix":    ["netflix.com","nflxvideo.net","nflximg.net"],
    "twitter":    ["twitter.com","x.com","twimg.com"],
    "google":     ["google.com","googleapis.com","gstatic.com"],
    "cloudflare": ["cloudflare.com","1.1.1.1"],
    "discord":    ["discord.com","discordapp.com"],
    "reddit":     ["reddit.com","redd.it","redditmedia.com"],
}

BLOCKED_BY_DEFAULT = {"tiktok"}

def classify(domain):
    d = domain.lower()
    for app, patterns in APP_SIGNATURES.items():
        if any(d == p or d.endswith("." + p) or p in d for p in patterns):
            return app, "TLS1.3"
    return "unknown", "TLS1.2"

def fake_ip():
    return f"{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    lb, fp, flows = LoadBalancer(), FastPath(), []
    for domain in req.domains:
        domain   = domain.lower().strip()
        src_ip   = fake_ip()
        dst_ip   = await resolve_domain(domain) or fake_ip()
        src_port = random.randint(1024, 65535)
        h        = hash_five_tuple(src_ip, dst_ip, src_port, 443, 6)
        lb_idx   = lb.assign(h)
        packets  = random.randint(8, 60)
        fp_idx   = fp.assign(h, packets)
        app, protocol = classify(domain)
        action   = "BLOCK" if app in BLOCKED_BY_DEFAULT else "FORWARD"
        loop     = asyncio.get_event_loop()
        tls      = await loop.run_in_executor(None, extract_tls_info, domain)
        flows.append(FlowResult(
            domain=domain, app=app,
            protocol=tls.get("tls_version") or protocol,
            category="streaming" if app in {"youtube","netflix","twitch"} else "social",
            hash=h, lb_idx=lb_idx, fp_idx=fp_idx, action=action,
            packets=packets, bytes=packets * random.randint(800,1400),
            latency_ms=random.randint(8,120),
            server=ServerInfo(ip=dst_ip),
        ))
    return AnalyzeResponse(
        flows=flows, total=len(flows),
        forwarded=sum(1 for f in flows if f.action=="FORWARD"),
        blocked=sum(1 for f in flows if f.action=="BLOCK"),
        lb_stats=lb.get_stats(), fp_stats=fp.get_stats(),
    )
