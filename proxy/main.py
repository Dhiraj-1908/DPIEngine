import threading
import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rules import RuleEngine
from dpi_proxy import DPIProxy

# ── config from env (no hardcoding) ──────────────────────────
PROXY_HOST    = os.getenv("PROXY_HOST",    "127.0.0.1")
PROXY_PORT    = int(os.getenv("PROXY_PORT", "8080"))
CONTROL_HOST  = os.getenv("CONTROL_HOST",  "127.0.0.1")
CONTROL_PORT  = int(os.getenv("CONTROL_PORT", "8001"))

# ── shared state ─────────────────────────────────────────────
rule_engine = RuleEngine()
packet_log  = []
proxy       = DPIProxy(PROXY_HOST, PROXY_PORT, rule_engine, packet_log)

# ── control API ──────────────────────────────────────────────
app = FastAPI(title="DPI Proxy Control API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class RuleUpdate(BaseModel):
    blocked: bool

@app.post("/rules/{app_name}")
def set_rule(app_name: str, body: RuleUpdate):
    rule_engine.set_rule(app_name, body.blocked)
    return {"app": app_name, "blocked": body.blocked}

@app.get("/status")
def status():
    return {
        "online": True,
        "proxy":  f"{PROXY_HOST}:{PROXY_PORT}",
        "stats":  proxy.stats,
        "rules":  rule_engine.get_all(),
    }

@app.get("/packets")
def packets(limit: int = 50):
    return {"packets": packet_log[-limit:]}

# ── startup ──────────────────────────────────────────────────
def start_proxy():
    proxy.start()

if __name__ == "__main__":
    print("\n╔══════════════════════════════════════════════════════╗")
    print("║         DPI PROXY ENGINE  —  LIVE MODE               ║")
    print("╠══════════════════════════════════════════════════════╣")
    print(f"║  Proxy:     http://{PROXY_HOST}:{PROXY_PORT}                    ║")
    print(f"║  Control:   http://{CONTROL_HOST}:{CONTROL_PORT}                   ║")
    print("╚══════════════════════════════════════════════════════╝\n")

    t = threading.Thread(target=start_proxy, daemon=True)
    t.start()

    uvicorn.run(app, host=CONTROL_HOST, port=CONTROL_PORT, log_level="warning")