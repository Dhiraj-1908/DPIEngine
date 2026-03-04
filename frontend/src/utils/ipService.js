import { computeThreatScore } from './ipUtils'

const BASE = import.meta.env.VITE_IP_API || 'http://ip-api.com/json'

export async function fetchIPIntel(ip) {
  const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query'
  const res  = await fetch(`${BASE}/${ip}?fields=${fields}`)
  const data = await res.json()

  if (data.status !== 'success') throw new Error(data.message || 'Lookup failed')

  // ip-api uses "proxy" field for both VPN and proxy
  const enriched = {
    ...data,
    vpn:         data.proxy,   // ip-api doesn't distinguish; treat same
    tor:         false,        // ip-api free tier doesn't provide tor flag
    threatScore: computeThreatScore({ ...data, vpn: data.proxy }),
  }
  return enriched
}

export async function fetchMyIP() {
  const res  = await fetch('http://ip-api.com/json/?fields=query')
  const data = await res.json()
  return data.query
}