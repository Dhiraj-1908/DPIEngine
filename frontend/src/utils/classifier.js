import { APP_SIGNATURES, KNOWN_SERVERS } from '../constants/signatures'

export function classifyApp(domain) {
  const d = domain.toLowerCase().trim()
  for (const [app, sig] of Object.entries(APP_SIGNATURES)) {
    if (sig.sni.some(s => d === s || d.endsWith('.' + s) || d.includes(s))) {
      return { app, protocol: sig.protocol, category: sig.category }
    }
  }
  return { app: 'unknown', protocol: 'TLS1.2', category: 'other' }
}

export function getServerInfo(domain) {
  const d = domain.toLowerCase().trim()
  for (const [key, info] of Object.entries(KNOWN_SERVERS)) {
    if (d === key || d.endsWith('.' + key)) return info
  }
  // generate plausible fake data for unknown domains
  const seed = domain.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const lats  = [37.4, 51.5, 48.8, 35.6, 1.3, -33.8, 19.0, 55.7]
  const lons  = [-122, -0.1, 2.3, 139.6, 103.8, 151.2, 72.8, 37.6]
  const cities   = ['San Francisco','London','Paris','Tokyo','Singapore','Sydney','Mumbai','Moscow']
  const countries = ['US','GB','FR','JP','SG','AU','IN','RU']
  const orgs     = ['Cloudflare','Fastly','AWS','Azure','GCP','Akamai','Limelight','Zayo']
  const i = seed % lats.length
  return {
    ip:      `${(seed*7)%220+10}.${(seed*13)%250}.${(seed*3)%250}.${seed%250}`,
    city:    cities[i], country: countries[i],
    lat:     lats[i],   lon:     lons[i],
    org:     orgs[seed % orgs.length],
  }
}

export function parseDomains(raw) {
  return raw
    .split(/[\n,]+/)
    .map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
    .filter(d => d.length > 2 && d.includes('.'))
}