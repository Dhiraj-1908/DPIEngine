from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, ip_intel
import datetime, asyncio, httpx
from routers import analyze, ip_intel, tracer, explain


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
app.include_router(tracer.router)               # add this line
app.include_router(explain.router)


@app.on_event("startup")
async def keep_alive():
    async def ping():
        while True:
            await asyncio.sleep(60 * 20)  # every 20 minutes
            try:
                async with httpx.AsyncClient() as client:
                    await client.get("https://dpiengine.onrender.com/health", timeout=10)
            except:
                pass
    asyncio.create_task(ping())

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

