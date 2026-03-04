// Packet Lab DPI Engine — background.js (Manifest V3)

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

function classifyHost(hostname) {
  const h = hostname.toLowerCase().replace(/^www\./, '')
  for (const [app, domains] of Object.entries(APP_SIGNATURES)) {
    if (domains.some(d => h === d || h.endsWith('.' + d))) return app
  }
  return 'other'
}

let rules   = { tiktok:false, instagram:false, youtube:false, facebook:false, twitter:false, netflix:false, discord:false, reddit:false }
let packets = []   // in-memory only, NOT persisted to storage
let stats   = { total:0, forwarded:0, blocked:0 }
let enabled = true

// Keep service worker alive
function keepAlive() {
  setTimeout(() => { chrome.runtime.getPlatformInfo(() => keepAlive()) }, 20000)
}
keepAlive()

// Load only rules + enabled from storage (NOT packets)
chrome.storage.local.get(['rules','enabled'], (data) => {
  if (data.rules) rules = { ...rules, ...data.rules }
  if (data.enabled !== undefined) enabled = data.enabled
  applyBlockingRules()
})

async function applyBlockingRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules()
  const removeIds = existing.map(r => r.id)
  const addRules = []
  let id = 1
  for (const [app, blocked] of Object.entries(rules)) {
    if (!blocked || !enabled) continue
    const domains = APP_SIGNATURES[app] || []
    for (const domain of domains) {
      addRules.push({
        id: id++,
        priority: 1,
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

// Log ALL traffic — no filtering
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const url      = new URL(details.url)
      const hostname = url.hostname
      if (!hostname) return

      const app     = classifyHost(hostname)
      const blocked = enabled && app !== 'other' && rules[app] === true
      const action  = blocked ? 'BLOCK' : 'FORWARD'
      const ts      = new Date().toTimeString().slice(0, 8)

      stats.total++
      if (blocked) stats.blocked++
      else stats.forwarded++

      // Push to end — oldest first, newest last
      packets.push({ time: ts, host: hostname, app, action })
      if (packets.length > 1000) packets.shift()

      // Do NOT call chrome.storage.local.set here — too slow, causes throttling
    } catch(e) {}
  },
  { urls: ['<all_urls>'] }
)

function handleMessage(msg, sendResponse) {
  if (msg.type === 'GET_STATUS') {
    // Send all packets in memory
    sendResponse({ online: enabled, stats, rules, packets: [...packets] })
    return
  }
  if (msg.type === 'SET_RULE') {
    rules[msg.app] = msg.blocked
    chrome.storage.local.set({ rules })
    applyBlockingRules()
    sendResponse({ ok: true })
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
    stats   = { total:0, forwarded:0, blocked:0 }
    packets = []
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