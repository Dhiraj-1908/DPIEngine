from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, ip_intel
import datetime

app = FastAPI(title="DPI Engine API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://dpi-engine.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router)
app.include_router(ip_intel.router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }