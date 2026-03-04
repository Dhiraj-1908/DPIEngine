import { create } from 'zustand'

async function extMessage(msg) {
  return new Promise((resolve) => {
    if (!window.chrome?.runtime?.sendMessage) return resolve(null)
    try {
      const id = 'klfhacifaepmeanlonkkcmphhfgelddh'
      chrome.runtime.sendMessage(id, msg, (res) => {
        if (chrome.runtime.lastError) return resolve(null)
        resolve(res || null)
      })
    } catch {
      resolve(null)
    }
  })
}

const DEFAULT_RULES = {
  tiktok: false, instagram: false, youtube: false, facebook: false,
  twitter: false, netflix: false, discord: false, reddit: false,
}
const ZERO_STATS = { total: 0, forwarded: 0, blocked: 0, rate: 0 }

export const useProxyStore = create((set, get) => ({
  isOnline:     false,
  isConnected:  false,
  verifyStatus: 'idle',
  rules:        { ...DEFAULT_RULES },
  packets:      [],
  stats:        { ...ZERO_STATS },
  pollTimer:    null,

  connect: async () => {
    set({ verifyStatus: 'checking' })

    // First clear all previous data in the extension
    await extMessage({ type: 'CLEAR_STATS' })

    // Now connect and get fresh state
    const res = await extMessage({ type: 'GET_STATUS' })
    if (res) {
      set({
        verifyStatus: 'success',
        isOnline:     true,
        isConnected:  true,
        stats:        { ...ZERO_STATS },  // always start at zero
        rules:        res.rules || { ...DEFAULT_RULES },
        packets:      [],                 // always start empty
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
      isOnline:     false,
      isConnected:  false,
      verifyStatus: 'idle',
      stats:        { ...ZERO_STATS },
      packets:      [],
      rules:        { ...DEFAULT_RULES },
    })
  },

  toggleRule: async (app) => {
    const next = !get().rules[app]
    set(s => ({ rules: { ...s.rules, [app]: next } }))
    await extMessage({ type: 'SET_RULE', app, blocked: next })
  },

  startPolling: () => {
    if (get().pollTimer) return
    const timer = setInterval(async () => {
      const res = await extMessage({ type: 'GET_STATUS' })
      if (res) {
        set({
          isOnline: true,
          stats:    res.stats   || get().stats,
          rules:    res.rules   || get().rules,
          packets:  res.packets || [],
        })
      } else {
        get().disconnect()
      }
    }, 1500)
    set({ pollTimer: timer })
  },

  stopPolling: () => {
    const { pollTimer } = get()
    if (pollTimer) clearInterval(pollTimer)
    set({ pollTimer: null })
  },
}))