import { djb2Hash, hashFiveTuple, hashToLB, hashToFP } from './hash'
import { classifyApp, getServerInfo, parseDomains }     from './classifier'
import { API_URL }                                       from '../constants/signatures'

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function fakeIP() {
  return `${randInt(1,254)}.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`
}

// ─── DEMO MODE (local, no backend) ───────────────────────────────────────────
async function runDemoMode({ domains, blockedApps, customBlockedDomains, callbacks }) {
  const { onLine, onFlow, onDone } = callbacks
  const flows     = []
  const lbCounts  = [0, 0]
  const fpCounts  = [0, 0, 0, 0]

  for (let i = 0; i < domains.length; i++) {
    const domain  = domains[i]
    await new Promise(r => setTimeout(r, 180 + randInt(0, 120)))

    const srcIP   = fakeIP()
    const dstIP   = fakeIP()          // ← FAKE
    const srcPort = randInt(1024, 65535)
    const hash    = hashFiveTuple(srcIP, dstIP, srcPort, 443, 6)
    const lbIdx   = hashToLB(hash)
    const fpIdx   = hashToFP(hash)
    const packets = randInt(8, 60)
    const { app, protocol, category } = classifyApp(domain)
    const serverInfo  = getServerInfo(domain)   // ← FAKE coords
    const isBlocked   = blockedApps.has(app) ||
      customBlockedDomains.some(bd => domain.includes(bd))

    lbCounts[lbIdx]++
    fpCounts[fpIdx] += packets

    const flow = {
      id: `flow-${i}`, domain,
      srcIP, dstIP, srcPort, dstPort: 443, proto: 6,
      hash: hash >>> 0, lbIdx, fpIdx,
      app, protocol, category,
      action:     isBlocked ? 'BLOCK' : 'FORWARD',
      packets,
      bytes:      packets * randInt(800, 1400),
      latency:    randInt(8, 120),
      serverInfo,
      realData:   false,    // ← flag so UI can show DEMO badge
    }
    flows.push(flow)

    onLine(`[DEMO][${String(i).padStart(3,'0')}] SNI=${domain.padEnd(30)} app=${app.padEnd(12)} hash=0x${hash.toString(16).padStart(8,'0')} LB${lbIdx}→FP${fpIdx} ${isBlocked ? '🔴 DROP' : '🟢 FWD'}`)
    onFlow(
      [...flows],
      { totalFlows: flows.length, totalPackets: fpCounts.reduce((a,b)=>a+b,0), forwarded: flows.filter(f=>f.action==='FORWARD').length, blocked: flows.filter(f=>f.action==='BLOCK').length },
      [{ id:0, flows:lbCounts[0] },{ id:1, flows:lbCounts[1] }],
      fpCounts.map((p,i)=>({ id:i, pkts:p }))
    )
  }
  onDone(flows)
}

// ─── LIVE API MODE (real backend) ────────────────────────────────────────────
async function runLiveMode({ domains, blockedApps, customBlockedDomains, callbacks }) {
  const { onLine, onFlow, onDone } = callbacks

  onLine(`[LIVE] Calling backend at ${API_URL}/analyze ...`)
  onLine(`[LIVE] Backend will do real DNS + TLS probe for each domain`)
  onLine('─'.repeat(60))

  let res, data
  try {
    res  = await fetch(`${API_URL}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ domains }),
    })
    data = await res.json()
  } catch (e) {
    onLine(`[ERR] Cannot reach backend at ${API_URL}`)
    onLine(`[ERR] Make sure: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000`)
    onLine(`[ERR] Falling back to DEMO mode...`)
    onLine('─'.repeat(60))
    return runDemoMode({ domains, blockedApps, customBlockedDomains, callbacks })
  }

  // map backend response → frontend flow format
  const flows    = []
  const lbCounts = [0, 0]
  const fpCounts = [0, 0, 0, 0]

  for (let i = 0; i < data.flows.length; i++) {
    const f       = data.flows[i]
    const isBlocked = blockedApps.has(f.app) ||
      customBlockedDomains.some(bd => f.domain.includes(bd)) ||
      f.action === 'BLOCK'

    // merge backend server data with local fallback
   // replace the serverInfo block with this:
let serverInfo
if (f.server && (f.server.lat || f.server.lon)) {
  serverInfo = {
    ip:      f.server.ip,
    city:    f.server.city    || 'Unknown',
    country: f.server.country || 'Unknown',
    lat:     Number(f.server.lat) || 0,
    lon:     Number(f.server.lon) || 0,
    org:     f.server.org     || 'Unknown',
  }
} else {
  // backend didn't return coords — fetch geolocation client-side
  try {
    const geo = await fetch(`http://ip-api.com/json/${f.server?.ip || f.domain}?fields=status,city,country,lat,lon,org`)
    const geoData = await geo.json()
    serverInfo = {
      ip:      f.server?.ip || '',
      city:    geoData.city    || 'Unknown',
      country: geoData.country || 'Unknown',
      lat:     Number(geoData.lat) || 0,
      lon:     Number(geoData.lon) || 0,
      org:     geoData.org     || 'Unknown',
    }
  } catch {
    serverInfo = getServerInfo(f.domain)
  }
}

    lbCounts[f.lb_idx]++
    fpCounts[f.fp_idx] += f.packets

    const flow = {
      id:         `flow-${i}`,
      domain:     f.domain,
      srcIP:      'YOUR_IP',          // srcIP is still fake (privacy)
      dstIP:      f.server?.ip || '?', // ← REAL destination IP
      srcPort:    randInt(1024, 65535),
      dstPort:    443,
      proto:      6,
      hash:       f.hash,
      lbIdx:      f.lb_idx,
      fpIdx:      f.fp_idx,
      app:        f.app,
      protocol:   f.protocol,         // ← REAL TLS version from handshake
      category:   f.category,
      action:     isBlocked ? 'BLOCK' : 'FORWARD',
      packets:    f.packets,
      bytes:      f.bytes,
      latency:    f.latency_ms,
      serverInfo,
      realData:   true,               // ← flag so UI shows LIVE badge
    }
    flows.push(flow)

    // small delay so terminal animates instead of all at once
    await new Promise(r => setTimeout(r, 120))

    onLine(`[LIVE][${String(i).padStart(3,'0')}] SNI=${f.domain.padEnd(30)} app=${f.app.padEnd(12)} ip=${f.server?.ip?.padEnd(16)||'?'.padEnd(16)} tls=${f.protocol} LB${f.lb_idx}→FP${f.fp_idx} ${isBlocked ? '🔴 DROP' : '🟢 FWD'}`)
    onFlow(
      [...flows],
      { totalFlows: flows.length, totalPackets: fpCounts.reduce((a,b)=>a+b,0), forwarded: flows.filter(f=>f.action==='FORWARD').length, blocked: flows.filter(f=>f.action==='BLOCK').length },
      [{ id:0, flows:lbCounts[0] },{ id:1, flows:lbCounts[1] }],
      fpCounts.map((p,i)=>({ id:i, pkts:p }))
    )
  }
  onDone(flows)
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
export async function analyzeDomains({ raw, blockedApps, customBlockedDomains, useRealAPI, callbacks }) {
  const domains = parseDomains(raw)
  if (!domains.length) return

  if (useRealAPI) {
    await runLiveMode({ domains, blockedApps, customBlockedDomains, callbacks })
  } else {
    await runDemoMode({ domains, blockedApps, customBlockedDomains, callbacks })
  }
}