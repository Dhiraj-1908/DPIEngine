import { create } from 'zustand'
import { useProxyStore } from './useProxyStore'

let _extensionId = null

function getExtId() {
  return useProxyStore.getState?.()?.extensionId || _extensionId || null
}

function sendToExtension(type, payload = {}) {
  return new Promise((resolve) => {
    const id = getExtId()
    if (!id) { resolve(null); return }
    try {
      chrome.runtime.sendMessage(id, { type, ...payload }, (resp) => {
        if (chrome.runtime.lastError) { resolve(null); return }
        resolve(resp || null)
      })
    } catch { resolve(null) }
  })
}

function tryPingExtension(id) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(id, { type: 'PING' }, (resp) => {
        if (chrome.runtime.lastError || !resp?.pong) { resolve(false); return }
        resolve(true)
      })
    } catch { resolve(false) }
  })
}

function extractDomain(target) {
  const t = (target || '').trim()
  if (t.startsWith('http')) {
    try { return new URL(t).hostname.replace(/^www\./, '') } catch {}
  }
  return t.replace(/^www\./, '').split('/')[0].split('?')[0]
}

export const useTracerStore = create((set, get) => {

  // ── Extension discovery ───────────────────────────────────────────────────
  window.addEventListener('message', async (e) => {
    if (e.data?.type === 'EXTENSION_ANNOUNCE' && e.data?.extensionId) {
      const id = e.data.extensionId
      const alive = await tryPingExtension(id)
      if (alive) {
        _extensionId = id
        localStorage.setItem('dpi_ext_id', id)
        set({ extConnected: true })
      }
    }
  })

  useProxyStore.subscribe((state) => {
    const extId = state.extensionId
    if (extId && extId !== _extensionId) {
      _extensionId = extId
      set({ extConnected: true })
    } else if (!extId && !_extensionId) {
      set({ extConnected: false })
    }
  })

  ;(async () => {
    const proxyExtId = useProxyStore.getState?.()?.extensionId
    if (proxyExtId) { _extensionId = proxyExtId; set({ extConnected: true }); return }
    const stored = localStorage.getItem('dpi_ext_id')
    if (stored) {
      const alive = await tryPingExtension(stored)
      if (alive) { _extensionId = stored; set({ extConnected: true }) }
    }
  })()

  return {
    // State
    target:      '',
    domain:      '',
    phase:       'idle',
    staticData:  null,
    liveCapture: null,
    error:       null,
    openTabs:    [],
    extConnected: false,
    pollTimer:   null,
    elapsedSecs: 0,
    tickTimer:   null,
    activeStep:  -1,

    // ── AI explanation cache — persists across page navigation ──────────────
    aiRaw:  '',
    aiDone: false,

    // ── Main entry point ────────────────────────────────────────────────────
    runTrace: async (target) => {
      if (!target?.trim()) return
      const domain = extractDomain(target)
      if (!domain) return

      get()._clearTimers()
      const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'

      set({
        target, domain, phase: 'static',
        staticData: null, liveCapture: null, error: null,
        openTabs: [], elapsedSecs: 0, activeStep: -1,
        // Clear AI cache when a new trace starts
        aiRaw: '', aiDone: false,
      })

      // Re-check extension
      if (!_extensionId) {
        const proxyId = useProxyStore.getState?.()?.extensionId
        if (proxyId) { _extensionId = proxyId; set({ extConnected: true }) }
        else {
          const stored = localStorage.getItem('dpi_ext_id')
          if (stored) {
            const alive = await tryPingExtension(stored)
            if (alive) { _extensionId = stored; set({ extConnected: true }) }
          }
        }
      }
      const proxyConnected = !!useProxyStore.getState?.()?.isConnected
      if (proxyConnected !== get().extConnected) {
        set({ extConnected: proxyConnected || !!_extensionId })
      }

      const tickTimer = setInterval(() => set(s => ({ elapsedSecs: s.elapsedSecs + 1 })), 1000)
      set({ tickTimer })

      const [staticResult, tabResult] = await Promise.allSettled([
        fetch(`${BACKEND}/trace?target=${encodeURIComponent(target)}`).then(r => r.json()),
        _extensionId ? sendToExtension('GET_TABS_FOR_DOMAIN', { domain }) : Promise.resolve(null),
      ])

      const sd   = staticResult.status === 'fulfilled' ? staticResult.value : null
      const tabs = tabResult.status === 'fulfilled' && tabResult.value?.tabs ? tabResult.value.tabs : []

      if (!sd) {
        set({ phase: 'error', error: 'Static analysis failed. Is the backend running?' })
        get()._clearTimers()
        return
      }

      set({ staticData: sd })

      if (!_extensionId) {
        set({ phase: 'done' })
        get()._clearTimers()
        return
      }

      if (tabs.length === 0) {
        await sendToExtension('START_TRACE', { domain, tabId: null })
        set({ phase: 'capturing' })
        get()._startPolling(domain)
      } else if (tabs.length === 1) {
        await sendToExtension('START_TRACE', { domain, tabId: tabs[0].tabId })
        set({ phase: 'capturing' })
        get()._startPolling(domain)
      } else {
        set({ phase: 'tab-pick', openTabs: tabs })
      }
    },

    selectTab: async (tabId) => {
      const { domain } = get()
      await sendToExtension('START_TRACE', { domain, tabId: tabId || null })
      set({ phase: 'capturing', openTabs: [] })
      get()._startPolling(domain)
    },

    _startPolling: (domain) => {
      const timer = setInterval(async () => {
        const resp = await sendToExtension('GET_TRACE_DATA', { domain })
        if (!resp?.capture) return

        const prev = get().liveCapture
        const next = resp.capture

        const changed =
          (next?.responsePackets?.length || 0) !== (prev?.responsePackets?.length || 0) ||
          (next?.apiCalls?.length || 0)        !== (prev?.apiCalls?.length || 0)        ||
          next?.requestCount                   !== prev?.requestCount                   ||
          next?.authState?.isAuthenticated     !== prev?.authState?.isAuthenticated

        if (changed) set({ liveCapture: next })
      }, 400)

      set({ pollTimer: timer })
    },

    stopCapture: async () => {
      const { domain } = get()
      await sendToExtension('STOP_TRACE', { domain })
      get()._clearTimers()
      set({ phase: 'done' })
    },

    reset: async () => {
      const { domain } = get()
      if (domain) await sendToExtension('CLEAR_TRACE', { domain })
      get()._clearTimers()
      set({
        target: '', domain: '', phase: 'idle',
        staticData: null, liveCapture: null, error: null,
        openTabs: [], elapsedSecs: 0, activeStep: -1,
        // Also clear AI cache on full reset
        aiRaw: '', aiDone: false,
      })
    },

    // Update AI cache — called by AIExplainPage while streaming
    setAICache: (raw, done) => set({ aiRaw: raw, aiDone: done }),

    _clearTimers: () => {
      const { pollTimer, tickTimer } = get()
      if (pollTimer) { clearInterval(pollTimer); set({ pollTimer: null }) }
      if (tickTimer) { clearInterval(tickTimer); set({ tickTimer: null }) }
    },
  }
})