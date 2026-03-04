import { computeThreatScore } from './ipUtils'

const BASE = import.meta.env.VITE_IP_API || 'https://ip-api.com/json'

export async function fetchIPIntel(ip) {
  const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query'
  const res  = await fetch(`${BASE}/${ip}?fields=${fields}`)
  const data = await res.json()

  if (data.status !== 'success') throw new Error(data.message || 'Lookup failed')

  const enriched = {
    ...data,
    vpn:         data.proxy,
    tor:         false,
    threatScore: computeThreatScore({ ...data, vpn: data.proxy }),
  }
  return enriched
}

export async function fetchMyIP() {
  const res  = await fetch('https://ip-api.com/json/?fields=query')
  const data = await res.json()
  return data.query
}
