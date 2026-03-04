import { computeThreatScore } from './ipUtils'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function fetchIPIntel(ip) {
  const res  = await fetch(`${BACKEND}/ip/lookup/${ip}`)
  if (!res.ok) throw new Error('Lookup failed')
  return await res.json()
}

export async function fetchMyIP() {
  const res  = await fetch(`${BACKEND}/ip/me`)
  if (!res.ok) throw new Error('Failed to get IP')
  const data = await res.json()
  return data.ip
}