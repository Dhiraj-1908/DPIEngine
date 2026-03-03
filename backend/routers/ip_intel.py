from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()
FIELDS = "status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query"

def compute_threat(data):
    score = 0
    if data.get("proxy"):   score += 35
    if data.get("hosting"): score += 15
    if data.get("mobile"):  score -= 10
    return max(0, min(100, score))

@router.get("/ip/lookup/{ip}")
async def lookup_ip(ip: str):
    async with httpx.AsyncClient(timeout=6) as client:
        r = await client.get(f"http://ip-api.com/json/{ip}", params={"fields": FIELDS})
        data = r.json()
    if data.get("status") != "success":
        raise HTTPException(400, detail=data.get("message", "Lookup failed"))
    data["vpn"]         = data.get("proxy", False)
    data["tor"]         = False
    data["threatScore"] = compute_threat(data)
    return data

@router.get("/ip/me")
async def my_ip():
    async with httpx.AsyncClient(timeout=6) as client:
        r = await client.get("http://ip-api.com/json/", params={"fields": "query"})
        data = r.json()
    return {"ip": data.get("query")}
