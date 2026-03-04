from fastapi import APIRouter, HTTPException
import httpx, os

router = APIRouter()
IPINFO_TOKEN = os.getenv("IPINFO_TOKEN", "")

@router.get("/ip/lookup/{ip}")
async def lookup_ip(ip: str):
    async with httpx.AsyncClient(timeout=6) as client:
        r = await client.get(
            f"https://api.ipinfo.io/lite/{ip}",
            headers={"Authorization": f"Bearer {IPINFO_TOKEN}"}
        )
        data = r.json()

    if data.get("status") == "error" or "bogon" in data:
        raise HTTPException(400, detail="Lookup failed")

    lat, lon = None, None
    if data.get("latitude") and data.get("longitude"):
        lat = float(data["latitude"])
        lon = float(data["longitude"])

    return {
        "query":       data.get("ip"),
        "country":     data.get("country_name"),
        "countryCode": data.get("country"),
        "regionName":  data.get("region"),
        "city":        data.get("city"),
        "zip":         data.get("postal_code"),
        "lat":         lat,
        "lon":         lon,
        "timezone":    data.get("timezone"),
        "isp":         data.get("asn_name"),
        "org":         data.get("asn_name"),
        "as":          data.get("asn"),
        "proxy":       False,
        "hosting":     False,
        "mobile":      False,
        "vpn":         False,
        "tor":         False,
        "threatScore": 0,
    }

@router.get("/ip/me")
async def my_ip():
    async with httpx.AsyncClient(timeout=6) as client:
        r = await client.get(
            "https://api.ipinfo.io/lite/me",
            headers={"Authorization": f"Bearer {IPINFO_TOKEN}"}
        )
        data = r.json()
    return {"ip": data.get("ip")}