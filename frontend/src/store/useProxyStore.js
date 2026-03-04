import { create } from 'zustand'

async function extMessage(msg) {
  return new Promise((resolve) => {
    if (!window.chrome?.runtime?.sendMessage) return resolve(null)
    try {
      const id = import.meta.env.VITE_EXTENSION_ID || 'klfhacifaepmeanlonkkcmphhfgelddh'
      chrome.runtime.sendMessage(id, msg, (res) => {
        if (chrome.runtime.lastError) return resolve(null)
        resolve(res || null)
      })
    } catch { resolve(null) }
  })
}

const DEFAULT_RULES = {
  tiktok: false, instagram: false, youtube: false, facebook: false,
  twitter: false, netflix: false, discord: false, reddit: false,
}
const ZERO_STATS = { total: 0, forwarded: 0, blocked: 0, rate: 0 }

export const useProxyStore = create((set, get) => ({
  isOnline:      false,
  isConnected:   false,
  verifyStatus:  'idle',
  rules:         { ...DEFAULT_RULES },  // includes custom domain keys too
  customBlocked: [],                    // ordered list, newest first
  customRules:   {},                    // { domain: true/false }
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
    set({
      isOnline: false, isConnected: false, verifyStatus: 'idle',
      stats: { ...ZERO_STATS }, packets: [], rules: { ...DEFAULT_RULES },
      customBlocked: [], customRules: {}, lastSeq: 0,
    })
  },

  // Used for both built-in AND custom domain toggles
  toggleRule: async (app) => {
    const next = !get().rules[app]
    set(s => ({ rules: { ...s.rules, [app]: next } }))
    await extMessage({ type: 'SET_RULE', app, blocked: next })
  },

  addCustomBlock: async (domain) => {
    const res = await extMessage({ type: 'ADD_CUSTOM_BLOCK', domain })
    if (res?.ok) {
      set({
        customBlocked: res.customBlocked,
        customRules:   res.customRules,
        rules:         res.rules,   // extension returns updated rules with new domain
      })
    }
  },

  removeCustomBlock: async (domain) => {
    const res = await extMessage({ type: 'REMOVE_CUSTOM_BLOCK', domain })
    if (res?.ok) {
      set({
        customBlocked: res.customBlocked,
        customRules:   res.customRules,
        rules:         res.rules,   // extension returns rules with domain removed
      })
    }
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