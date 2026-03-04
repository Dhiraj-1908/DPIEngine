
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
  for (const domain of customBlocked) {
    sigs[domain] = [domain]
  }
  return sigs
}

function normalizeHost(h) {
  return h.toLowerCase().replace(/^www\./, '')
}

function matchesDomain(hostname, domain) {
  const h = normalizeHost(hostname)
  const d = normalizeHost(domain)
  return h === d || h.endsWith('.' + d)
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

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const hostname = new URL(details.url).hostname
      if (!hostname) return
      const app = classifyHost(hostname)
      if (!app) return

      const ts = new Date().toTimeString().slice(0, 8)
      stats.total++
      stats.forwarded++
      packetCounter++
      const pkt = { seq: packetCounter, time: ts, host: hostname, app, action: 'FORWARD' }
      packets.push(pkt)
      if (packets.length > 2000) packets.shift()

      pendingRequests.set(details.requestId, packetCounter)
      setTimeout(() => pendingRequests.delete(details.requestId), 10000)
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
        if (pkt) {
          pkt.action = 'BLOCK'
          stats.forwarded--
          stats.blocked++
        }
      } else {
        const hostname = new URL(details.url).hostname
        if (!hostname) return
        const app = classifyHost(hostname) || 'other'
        const ts  = new Date().toTimeString().slice(0, 8)
        stats.total++
        stats.blocked++
        packetCounter++
        packets.push({ seq: packetCounter, time: ts, host: hostname, app, action: 'BLOCK' })
        if (packets.length > 2000) packets.shift()
      }
    } catch(e) {}
  },
  { urls: ['<all_urls>'] }
)

function handleMessage(msg, sendResponse) {
  if (msg.type === 'GET_STATUS') {
    const lastSeq    = msg.lastSeq || 0
    const newPackets = packets.filter(p => p.seq > lastSeq)
    sendResponse({ online: enabled, stats, rules, customBlocked, customRules, packets: newPackets, totalSeq: packetCounter })
    return
  }
  if (msg.type === 'SET_RULE') {
    rules[msg.app] = msg.blocked
    if (customBlocked.includes(msg.app)) customRules[msg.app] = msg.blocked
    chrome.storage.local.set({ rules, customRules })
    applyBlockingRules()
    sendResponse({ ok: true })
    return
  }
  if (msg.type === 'ADD_CUSTOM_BLOCK') {
    const domain = msg.domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim()
    if (!domain || customBlocked.includes(domain)) {
      sendResponse({ ok: false, customBlocked, customRules, rules })
      return
    }
    customBlocked.unshift(domain)
    customRules[domain] = true
    rules[domain] = true
    chrome.storage.local.set({ customBlocked, customRules, rules })
    applyBlockingRules()
    sendResponse({ ok: true, customBlocked, customRules, rules })
    return
  }
  if (msg.type === 'REMOVE_CUSTOM_BLOCK') {
    const domain = msg.domain.toLowerCase().replace(/^www\./, '').trim()
    customBlocked = customBlocked.filter(d => d !== domain)
    delete customRules[domain]
    delete rules[domain]
    chrome.storage.local.set({ customBlocked, customRules, rules })
    applyBlockingRules()
    sendResponse({ ok: true, customBlocked, customRules, rules })
    return
  }
  if (msg.type === 'SET_ENABLED') {
    enabled = msg.enabled
    chrome.storage.local.set({ enabled })
    applyBlockingRules()
    sendResponse({ ok: true })
    return
  }
  if (msg.type === 'CLEAR_STATS') {
    stats = { total:0, forwarded:0, blocked:0 }
    packets = []
    packetCounter = 0
    pendingRequests.clear()
    sendResponse({ ok: true })
    return
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sendResponse)
  return true
})

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sendResponse)
  return true
})

// ── Auto-announce extension ID to any open DPI Engine tab ──
function announceToTab(tabId) {
  chrome.tabs.sendMessage(tabId, {
    type: 'EXTENSION_ANNOUNCE',
    extensionId: chrome.runtime.id
  }).catch(() => {})
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  const url = tab.url || ''
  const isPacketLab = url.includes('localhost:5173') || url.includes('dpi-engine.vercel.app')
  if (isPacketLab) announceToTab(tabId)
})

chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    const url = tab.url || ''
    const isPacketLab = url.includes('localhost:5173') || url.includes('dpi-engine.vercel.app')
    if (isPacketLab) announceToTab(tab.id)
  }
})