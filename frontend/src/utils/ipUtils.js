export function isValidIPv4(ip) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) &&
    ip.split('.').every(n => parseInt(n) <= 255)
}

export function computeThreatScore(data) {
  let score = 0
  if (data.proxy)   score += 35
  if (data.vpn)     score += 25
  if (data.tor)     score += 40
  if (data.hosting) score += 15
  if (data.mobile)  score -= 10
  if (!data.isp || data.isp === '') score += 10
  return Math.max(0, Math.min(100, score))
}

export function getThreatLabel(score) {
  if (score >= 70) return { label: 'HIGH RISK',   color: '#ef4444' }
  if (score >= 40) return { label: 'MEDIUM RISK', color: '#f59e0b' }
  if (score >= 15) return { label: 'LOW RISK',    color: '#3b82f6' }
  return              { label: 'CLEAN',           color: '#10b981' }
}

export function getDPIInsights(data) {
  const insights = []
  if (data.vpn || data.proxy) {
    insights.push({ icon: '🔐', text: 'Traffic tunneled — real origin concealed from DPI engines' })
    insights.push({ icon: '⚡', text: 'ISP sees encrypted VPN protocol, not destination SNI' })
  } else {
    insights.push({ icon: '🔍', text: `ISP (${data.isp || 'unknown'}) can see all SNI hostnames in TLS handshakes` })
    insights.push({ icon: '📡', text: 'Each DNS query is visible unless DoH/DoT is configured' })
  }
  if (data.tor) {
    insights.push({ icon: '🧅', text: 'Tor exit node — traffic bounced through 3+ relays' })
  }
  if (data.hosting) {
    insights.push({ icon: '🖥️', text: 'Datacenter IP — likely bot, scraper, or server' })
  }
  if (data.countryCode === 'CN' || data.countryCode === 'IR' || data.countryCode === 'RU') {
    insights.push({ icon: '🌐', text: 'Jurisdiction with known deep packet inspection infrastructure' })
  }
  return insights
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1048576).toFixed(1)} MB`
}