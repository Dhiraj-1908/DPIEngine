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

// Get precise location via browser GPS
export async function fetchPreciseLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy, // in meters
      }),
      (err) => reject(new Error('Location permission denied')),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  })
}