const APP_SIGNATURES = {
  tiktok:    ['tiktok.com', 'tiktokcdn.com', 'tiktokv.com', 'musical.ly'],
  instagram: ['instagram.com', 'cdninstagram.com'],
  youtube:   ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com'],
  facebook:  ['facebook.com', 'fb.com', 'fbcdn.net', 'fbsbx.com'],
  twitter:   ['twitter.com', 'x.com', 'twimg.com', 't.co'],
  netflix:   ['netflix.com', 'nflxvideo.net', 'nflximg.net'],
  discord:   ['discord.com', 'discord.gg', 'discordapp.com'],
  reddit:    ['reddit.com', 'redd.it', 'redditmedia.com'],
}

let customBlocked = []
let customRules   = {}
let rules         = { tiktok:false, instagram:false, youtube:false, facebook:false, twitter:false, netflix:false, discord:false, reddit:false }
let packets       = []
let stats         = { total:0, forwarded:0, blocked:0 }
let enabled       = true
let packetCounter = 0
const pendingRequests = new Map()

function getSignatures() {
  const sigs = { ...APP_SIGNATURES }
  for (const domain of customBlocked) sigs[domain] = [domain]
  return sigs
}

function normalizeHost(h) {
  return h.toLowerCase().replace(/^www\./, '')
}

function matchesDomain(hostname, tracedDomain) {
  const h = normalizeHost(hostname)
  const d = normalizeHost(tracedDomain)
  if (h === d || h.endsWith('.' + d)) return true
  const relatedMap = {
    'instagram.com': ['cdninstagram.com'],
    'facebook.com':  ['fbcdn.net', 'fbsbx.com', 'fb.com'],
    'twitter.com':   ['twimg.com', 't.co', 'x.com'],
    'youtube.com':   ['googlevideo.com', 'ytimg.com', 'youtu.be'],
    'netflix.com':   ['nflxvideo.net', 'nflximg.net'],
    'reddit.com':    ['redd.it', 'redditmedia.com'],
    'discord.com':   ['discordapp.com', 'discord.gg'],
    'tiktok.com':    ['tiktokcdn.com', 'tiktokv.com', 'musical.ly'],
  }
  const related = relatedMap[d] || []
  return related.some(r => h === r || h.endsWith('.' + r))
}

function classifyHost(hostname) {
  for (const [app, domains] of Object.entries(getSignatures())) {
    if (domains.some(d => matchesDomain(hostname, d))) return app
  }
  return null
}

function keepAlive() {
  setTimeout(() => { chrome.runtime.getPlatformInfo(() => keepAlive()) }, 20000)
}
keepAlive()

chrome.storage.local.get(['rules', 'enabled', 'customBlocked', 'customRules'], (data) => {
  if (data.rules)                 rules         = { ...rules, ...data.rules }
  if (data.enabled !== undefined) enabled       = data.enabled
  if (data.customBlocked)         customBlocked = data.customBlocked
  if (data.customRules)           customRules   = data.customRules
  for (const domain of customBlocked) {
    if (!(domain in rules)) rules[domain] = customRules[domain] !== false
  }
  applyBlockingRules()
})

async function applyBlockingRules() {
  const existing  = await chrome.declarativeNetRequest.getDynamicRules()
  const removeIds = existing.map(r => r.id)
  const addRules  = []
  let id = 1
  for (const [app, blocked] of Object.entries(rules)) {
    if (!blocked || !enabled) continue
    const domains = getSignatures()[app] || []
    for (const domain of domains) {
      addRules.push({
        id: id++, priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ['main_frame','sub_frame','xmlhttprequest','websocket','image','media','script','stylesheet','font','other']
        }
      })
    }
  }
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules })
}

// ── webRequest listeners ──────────────────────────────────────────────────────

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const hostname = new URL(details.url).hostname
      if (!hostname) return
      const app = classifyHost(hostname)
      if (!app) return
      const ts = new Date().toTimeString().slice(0, 8)
      stats.total++; stats.forwarded++; packetCounter++
      const pkt = { seq: packetCounter, time: ts, host: hostname, app, action: 'FORWARD' }
      packets.push(pkt)
      if (packets.length > 2000) packets.shift()
      pendingRequests.set(details.requestId, packetCounter)
      setTimeout(() => pendingRequests.delete(details.requestId), 10000)

      if (activeCaptureSession && matchesDomain(hostname, activeCaptureSession)) {
        const cap = domainCaptures[activeCaptureSession]
        if (cap && (activeCaptureTabId === null || details.tabId === activeCaptureTabId)) {
          cap.requestCount++
          const method = details.method || 'GET'
          if (/\/api\/|\/v[0-9]+\/|\/graphql|\/rest\/|\.json|\/ajax\//.test(details.url) || ['POST','PUT','PATCH'].includes(method)) {
            try {
              const u = new URL(details.url)
              cap.apiCalls.push({ method, path: u.pathname.substring(0, 60), query: u.search ? u.search.substring(0, 40) : null, ts: Date.now() })
              if (cap.apiCalls.length > 100) cap.apiCalls.shift()
            } catch(e) {}
          }
        }
      }
    } catch(e) {}
  },
  { urls: ['<all_urls>'] }
)

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    try {
      if (details.error !== 'net::ERR_BLOCKED_BY_CLIENT') return
      const seq = pendingRequests.get(details.requestId)
      pendingRequests.delete(details.requestId)
      if (seq !== undefined) {
        const pkt = packets.find(p => p.seq === seq)
        if (pkt) { pkt.action = 'BLOCK'; stats.forwarded--; stats.blocked++ }
      } else {
        const hostname = new URL(details.url).hostname
        if (!hostname) return
        const app = classifyHost(hostname) || 'other'
        const ts = new Date().toTimeString().slice(0, 8)
        stats.total++; stats.blocked++; packetCounter++
        packets.push({ seq: packetCounter, time: ts, host: hostname, app, action: 'BLOCK' })
        if (packets.length > 2000) packets.shift()
      }
    } catch(e) {}
  },
  { urls: ['<all_urls>'] }
)

chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    try {
      if (!activeCaptureSession) return
      const hostname = new URL(details.url).hostname
      if (!matchesDomain(hostname, activeCaptureSession)) return
      if (activeCaptureTabId !== null && details.tabId !== activeCaptureTabId) return
      const cap = domainCaptures[activeCaptureSession]
      if (!cap) return

      for (const h of details.requestHeaders || []) {
        const name = h.name.toLowerCase()
        const val  = h.value || ''

        if (name === 'cookie' && val.length > 0) {
          const pairs = val.split(';').map(c => c.trim()).filter(Boolean)
          const AUTH_PATTERN = /^(session|sid|auth|token|login|uid|user|jwt|__secure|csrf|sapisid|apisid|hsid|ssid|ds_user|ds_user_id|sessionid|ig_did|datr|c_user|xs|fr|sb|dbln|usida|connect\.sid|_session|access_token|refresh_token|id_token|bearer|api_key|x-auth|phpsessid|jsessionid)/i
          const authPairs = pairs.filter(c => AUTH_PATTERN.test(c.split('=')[0].trim()))
          if (authPairs.length > 0) {
            cap.authState.isAuthenticated = true
            cap.authState.authType = 'Session Cookie'
            const existing = new Set(cap.authState.cookies.map(c => c.name))
            authPairs.slice(0, 8).forEach(c => {
              const [k, ...rest] = c.split('=')
              const cname = k.trim()
              if (!existing.has(cname)) {
                cap.authState.cookies.push({ name: cname, value: rest.join('=').substring(0, 16) + '…', type: 'auth' })
                existing.add(cname)
              }
            })
          } else if (!cap.authState.isAuthenticated && pairs.length > 0) {
            const existing = new Set(cap.authState.cookies.map(c => c.name))
            pairs.slice(0, 4).forEach(c => {
              const [k] = c.split('=')
              const cname = k.trim()
              if (!existing.has(cname)) {
                cap.authState.cookies.push({ name: cname, value: '(tracking)', type: 'tracking' })
                existing.add(cname)
              }
            })
          }
        }

        if (name === 'authorization') {
          cap.authState.isAuthenticated = true
          cap.authState.authType = val.startsWith('Bearer') ? 'Bearer Token' : 'Auth Header'
          if (!cap.authState.tokens.find(t => t.type === cap.authState.authType)) {
            cap.authState.tokens.push({ type: cap.authState.authType, value: val.substring(0, 28) + '…' })
          }
        }

        if (['x-auth-token','x-access-token','x-api-key','x-ig-app-id','x-ig-www-claim'].includes(name)) {
          cap.authState.isAuthenticated = true
          cap.authState.authType = cap.authState.authType || 'API Header'
          if (!cap.authState.tokens.find(t => t.type === name)) {
            cap.authState.tokens.push({ type: name, value: val.substring(0, 20) + '…' })
          }
        }

        if (name === 'range') {
  try {
    const u = new URL(details.url)
    // Read actual mime param from URL — e.g. mime=video%2Fwebm or mime=audio%2Fwebm
    const mime = (u.searchParams.get('mime') || '').toLowerCase()
    const itag = u.searchParams.get('itag') || ''
    
    // itag number also tells us type:
    // YouTube itags 140,251 = audio | everything else = video
    const AUDIO_ITAGS = ['139','140','141','171','172','249','250','251']
    
    const type = mime.includes('audio') || AUDIO_ITAGS.includes(itag) ? 'audio' : 'video'
    
    cap.chunks.push({ 
      type, 
      range: val, 
      url: u.pathname.substring(0, 70), 
      ts: Date.now(), 
      size: null,
      mime: mime || null,
      itag: itag || null,
    })
    if (cap.chunks.length > 80) cap.chunks.shift()
  } catch(e) {}
}
      }
    } catch(e) {}
  },
  { urls: ['<all_urls>'] },
  ['requestHeaders']
)

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    try {
      if (!activeCaptureSession) return
      const hostname = new URL(details.url).hostname
      if (!matchesDomain(hostname, activeCaptureSession)) return
      if (activeCaptureTabId !== null && details.tabId !== activeCaptureTabId) return
      const cap = domainCaptures[activeCaptureSession]
      if (!cap) return

      const sc = String(details.statusCode)
      cap.statusCodes[sc] = (cap.statusCodes[sc] || 0) + 1

      let contentLength = null, contentType = null

      for (const h of details.responseHeaders || []) {
        const name = h.name.toLowerCase()
        const val  = h.value || ''

        if (name === 'set-cookie') {
          const flags = []
          if (/httponly/i.test(val))   flags.push('HttpOnly')
          if (/;\s*secure/i.test(val)) flags.push('Secure')
          const ss = val.match(/samesite=(\w+)/i)
          if (ss) flags.push(`SameSite=${ss[1]}`)
          const cookieName = val.split('=')[0].trim()
          if (!cap.authState.setCookies.find(c => c.name === cookieName)) {
            cap.authState.setCookies.push({ name: cookieName, flags })
            if (cap.authState.setCookies.length > 30) cap.authState.setCookies.shift()
          }
        }
        if (name === 'content-length') {
          contentLength = parseInt(val) || null
          const last = cap.chunks[cap.chunks.length - 1]
          if (last && !last.size) last.size = contentLength
        }
        if (name === 'content-type') contentType = val.split(';')[0].trim()
      }

      // Every response = a real packet flowing back to browser
      try {
        const u = new URL(details.url)
        cap.responsePackets.push({
          ts:     Date.now(),
          status: details.statusCode,
          host:   hostname,
          path:   u.pathname.substring(0, 60),
          size:   contentLength,
          type:   contentType?.includes('video') ? 'media'
                : contentType?.includes('audio') ? 'media'
                : contentType?.includes('json')  ? 'api'
                : contentType?.includes('image') ? 'image'
                : 'other',
        })
        if (cap.responsePackets.length > 300) cap.responsePackets.shift()
      } catch(e) {}

    } catch(e) {}
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
)

// ─────────────────────────────────────────────────────────────────────────────
// TRACER STATE
// ─────────────────────────────────────────────────────────────────────────────
let activeCaptureSession = null
let activeCaptureTabId   = null
let domainCaptures       = {}

function initCapture(domain) {
  domainCaptures[domain] = {
    domain, tabId: activeCaptureTabId, startedAt: Date.now(), requestCount: 0,
    authState: { isAuthenticated: false, authType: null, cookies: [], tokens: [], setCookies: [] },
    chunks: [], apiCalls: [], statusCodes: {}, responsePackets: [],
    videoState: null,        // ← add this
    _lastBufferedEnd: 0,     // ← add this
  }
}

function getTabsForDomain(domain) {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const matching = tabs
        .filter(t => { try { return matchesDomain(new URL(t.url || '').hostname, domain) } catch { return false } })
        .map(t => ({ tabId: t.id, title: t.title || t.url, url: t.url, active: t.active, favicon: t.favIconUrl || null }))
      resolve(matching)
    })
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────────────────────
function handleMessage(msg, sendResponse) {
  if (msg.type === 'PING') {
    // Respond to ping so frontend knows extension is alive
    sendResponse({ pong: true, extensionId: chrome.runtime.id })
    return
  }
  if (msg.type === 'GET_STATUS') {
    const lastSeq    = msg.lastSeq || 0
    const newPackets = packets.filter(p => p.seq > lastSeq)
    sendResponse({ online: enabled, stats, rules, customBlocked, customRules, packets: newPackets, totalSeq: packetCounter })
    return
  }
  if (msg.type === 'SET_RULE') {
    rules[msg.app] = msg.blocked
    if (customBlocked.includes(msg.app)) customRules[msg.app] = msg.blocked
    chrome.storage.local.set({ rules, customRules }); applyBlockingRules()
    sendResponse({ ok: true }); return
  }
  if (msg.type === 'ADD_CUSTOM_BLOCK') {
    const domain = msg.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim()
    if (!domain || customBlocked.includes(domain)) { sendResponse({ ok: false, customBlocked, customRules, rules }); return }
    customBlocked.unshift(domain); customRules[domain] = true; rules[domain] = true
    chrome.storage.local.set({ customBlocked, customRules, rules }); applyBlockingRules()
    sendResponse({ ok: true, customBlocked, customRules, rules }); return
  }
  if (msg.type === 'REMOVE_CUSTOM_BLOCK') {
    const domain = msg.domain.toLowerCase().replace(/^www\./, '').trim()
    customBlocked = customBlocked.filter(d => d !== domain)
    delete customRules[domain]; delete rules[domain]
    chrome.storage.local.set({ customBlocked, customRules, rules }); applyBlockingRules()
    sendResponse({ ok: true, customBlocked, customRules, rules }); return
  }
  if (msg.type === 'SET_ENABLED') {
    enabled = msg.enabled; chrome.storage.local.set({ enabled }); applyBlockingRules()
    sendResponse({ ok: true }); return
  }
  if (msg.type === 'CLEAR_STATS') {
    stats = { total:0, forwarded:0, blocked:0 }; packets = []; packetCounter = 0; pendingRequests.clear()
    sendResponse({ ok: true }); return
  }
  if (msg.type === 'GET_TABS_FOR_DOMAIN') {
    getTabsForDomain(msg.domain).then(tabs => sendResponse({ ok: true, tabs })); return
  }
  if (msg.type === 'START_TRACE') {
    activeCaptureSession = msg.domain
    activeCaptureTabId   = msg.tabId || null
    initCapture(msg.domain)
    sendResponse({ ok: true, domain: msg.domain, tabId: activeCaptureTabId }); return
  }
  if (msg.type === 'GET_TRACE_DATA') {
    sendResponse({ ok: true, capture: domainCaptures[msg.domain] || null }); return
  }
  if (msg.type === 'STOP_TRACE') {
    activeCaptureSession = null; activeCaptureTabId = null
    sendResponse({ ok: true }); return
  }
  if (msg.type === 'CLEAR_TRACE') {
    if (domainCaptures[msg.domain]) delete domainCaptures[msg.domain]
    if (activeCaptureSession === msg.domain) { activeCaptureSession = null; activeCaptureTabId = null }
    sendResponse({ ok: true }); return
  }

  // ─── REPLACE the VIDEO_BUFFER_UPDATE block in handleMessage() with this ───────

  if (msg.type === 'VIDEO_BUFFER_UPDATE') {
    if (activeCaptureSession) {
      const cap = domainCaptures[activeCaptureSession]
      if (cap) {
        const state = msg.state

        // ALWAYS store latest videoState — this is what the frontend polls
        cap.videoState = state

        // Track chunks based on buffer growth OR playhead advancing into new territory
        const prevBufferedEnd  = cap._lastBufferedEnd  || 0
        const prevCurrentTime  = cap._lastCurrentTime  || 0

        const bufferGrew    = state.bufferedEnd  > prevBufferedEnd  + 0.5
        const playheadMoved = state.currentTime  > prevCurrentTime  + 2.0  // seeking/skipping

        if (bufferGrew) {
          // New content buffered ahead
          cap.chunks.push({
            type:          'video',
            range:         `${prevBufferedEnd.toFixed(1)}s – ${state.bufferedEnd.toFixed(1)}s`,
            bufferedEnd:   state.bufferedEnd,
            bufferedAhead: state.bufferedAhead,
            currentTime:   state.currentTime,
            duration:      parseFloat((state.bufferedEnd - prevBufferedEnd).toFixed(2)),
            size:          null,
            ts:            Date.now(),
            fromBuffer:    true,
          })
          if (cap.chunks.length > 200) cap.chunks.shift()
          cap._lastBufferedEnd = state.bufferedEnd
        }

        if (playheadMoved && !bufferGrew) {
          // User seeked — reset buffer tracking so next growth registers
          cap._lastBufferedEnd = state.bufferedEnd
          cap._lastCurrentTime = state.currentTime
        } else {
          cap._lastCurrentTime = state.currentTime
        }
      }
    }
    sendResponse({ ok: true })
    return
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => { handleMessage(msg, sendResponse); return true })
chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => { handleMessage(msg, sendResponse); return true })

// ── Announce to all open DPI Engine tabs ──────────────────────────────────────
function announceToTab(tabId) {
  chrome.tabs.sendMessage(tabId, { type: 'EXTENSION_ANNOUNCE', extensionId: chrome.runtime.id }).catch(() => {})
}

function announceToAllDPITabs() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      const url = tab.url || ''
      if (url.includes('localhost:5173') || url.includes('dpi-engine.vercel.app')) {
        announceToTab(tab.id)
      }
    }
  })
}

// Announce on tab load
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  const url = tab.url || ''
  if (url.includes('localhost:5173') || url.includes('dpi-engine.vercel.app')) announceToTab(tabId)
})

// Announce immediately on extension start (covers extension reload case)
announceToAllDPITabs()

// Re-announce every 3s for the first 30s after startup (covers race conditions)
let announceCount = 0
const announceInterval = setInterval(() => {
  announceToAllDPITabs()
  announceCount++
  if (announceCount >= 10) clearInterval(announceInterval)
}, 3000)