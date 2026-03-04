import { create } from 'zustand'

const DEFAULT_RULES = {
  tiktok: false, instagram: false, youtube: false, facebook: false,
  twitter: false, netflix: false, discord: false, reddit: false,
}
const ZERO_STATS = { total: 0, forwarded: 0, blocked: 0, rate: 0 }

// Dynamically discovered extension ID
let discoveredExtensionId = import.meta.env.VITE_EXTENSION_ID || null

// Listen for the extension announcing itself via content script
window.addEventListener('message', (event) => {
  if (event.data?.type === 'EXTENSION_ANNOUNCE' && event.data?.extensionId) {
    discoveredExtensionId = event.data.extensionId
    console.log('[PacketLab] Extension auto-discovered:', discoveredExtensionId)
  }
})

async function extMessage(msg) {
  return new Promise((resolve) => {
    if (!window.chrome?.runtime?.sendMessage) return resolve(null)
    const id = discoveredExtensionId
    if (!id) return resolve(null)
    try {
      chrome.runtime.sendMessage(id, msg, (res) => {
        if (chrome.runtime.lastError) return resolve(null)
        resolve(res || null)
      })
    } catch { resolve(null) }
  })
}

export const useProxyStore = create((set, get) => ({
  isOnline:      false,
  isConnected:   false,
  verifyStatus:  'idle',
  rules:         { ...DEFAULT_RULES },
  customBlocked: [],
  customRules:   {},
  packets:       [],
  stats:         { ...ZERO_STATS },
  pollTimer:     null,
  lastSeq:       0,

  connect: async () => {
    set({ verifyStatus: 'checking' })
    await extMessage({ type: 'CLEAR_STATS' })
    const res = await extMessage({ type: 'GET_STATUS', lastSeq: 0 })
    if (res) {
      set({
        verifyStatus:  'success',
        isOnline:      true,
        isConnected:   true,
        stats:         { ...ZERO_STATS },
        rules:         res.rules         || { ...DEFAULT_RULES },
        customBlocked: res.customBlocked || [],
        customRules:   res.customRules   || {},
        packets:       [],
        lastSeq:       0,
      })
      get().startPolling()
    } else {
      set({ verifyStatus: 'failed', isOnline: false, isConnected: false })
      setTimeout(() => set({ verifyStatus: 'idle' }), 3000)
    }
  },

  disconnect: () => {
    get().stopPolling()
    set(s => ({
      isOnline: false, isConnected: false, verifyStatus: 'idle',
      stats: { ...ZERO_STATS }, packets: [], lastSeq: 0,
      // Keep rules, customBlocked, customRules intact
      rules: s.rules,
      customBlocked: s.customBlocked,
      customRules: s.customRules,
    }))
  },

  // ── Always update locally first, then sync to extension ──

  toggleRule: async (app) => {
    const next = !get().rules[app]
    set(s => ({ rules: { ...s.rules, [app]: next } }))
    await extMessage({ type: 'SET_RULE', app, blocked: next })
  },

  addCustomBlock: async (domain) => {
    // Update locally always
    set(s => ({
      customBlocked: [domain, ...s.customBlocked.filter(d => d !== domain)],
      customRules:   { ...s.customRules, [domain]: true },
      rules:         { ...s.rules, [domain]: true },
    }))
    // Sync to extension if connected
    await extMessage({ type: 'ADD_CUSTOM_BLOCK', domain })
  },

  removeCustomBlock: async (domain) => {
    // Update locally always
    set(s => ({
      customBlocked: s.customBlocked.filter(d => d !== domain),
      customRules:   { ...s.customRules, [domain]: false },
      rules:         { ...s.rules, [domain]: false },
    }))
    // Sync to extension if connected
    await extMessage({ type: 'REMOVE_CUSTOM_BLOCK', domain })
  },

  startPolling: () => {
    if (get().pollTimer) return
    const timer = setInterval(async () => {
      const { lastSeq } = get()
      const res = await extMessage({ type: 'GET_STATUS', lastSeq })
      if (!res) { get().disconnect(); return }
      const newPackets = res.packets || []
      set(s => ({
        isOnline:      true,
        stats:         res.stats         || s.stats,
        rules:         res.rules         || s.rules,
        customBlocked: res.customBlocked || s.customBlocked,
        customRules:   res.customRules   || s.customRules,
        packets:       newPackets.length > 0 ? [...s.packets, ...newPackets] : s.packets,
        lastSeq:       res.totalSeq      ?? s.lastSeq,
      }))
    }, 1000)
    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const { pollTimer } = get()
    if (pollTimer) clearInterval(pollTimer)
    set({ pollTimer: null })
  },
}))