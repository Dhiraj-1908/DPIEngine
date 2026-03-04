import { create } from 'zustand'

export const useDPIStore = create((set, get) => ({
  inputDomains: '',
  setInputDomains: (v) => set({ inputDomains: v }),

  isAnalyzing: false,
  flows: [],
  stats: { totalFlows: 0, totalPackets: 0, forwarded: 0, blocked: 0 },
  lbStats: [{ id: 0, flows: 0 }, { id: 1, flows: 0 }],
  fpStats: [{ id: 0, pkts: 0 }, { id: 1, pkts: 0 }, { id: 2, pkts: 0 }, { id: 3, pkts: 0 }],
  terminalLines: [],
  serverLocations: [],      // only latest analysis
  latestBatchIds: new Set(), // track latest batch

  blockedApps: new Set(['tiktok']),
  customBlockedDomains: [],
  toggleBlockApp: (app) => set(s => {
    const n = new Set(s.blockedApps)
    n.has(app) ? n.delete(app) : n.add(app)
    return { blockedApps: n }
  }),
  addCustomDomain: (d) => set(s => ({ customBlockedDomains: [...s.customBlockedDomains, d] })),
  removeCustomDomain: (d) => set(s => ({ customBlockedDomains: s.customBlockedDomains.filter(x => x !== d) })),

  useRealAPI: false,
  setUseRealAPI: (v) => set({ useRealAPI: v }),

  setAnalyzing: (v) => set({ isAnalyzing: v }),

  // APPEND new flows to existing instead of replacing
  appendFlows: (newFlows) => set(s => ({
    flows: [...s.flows, ...newFlows.filter(
      nf => !s.flows.find(ef => ef.id === nf.id)
    )]
  })),

  // ACCUMULATE stats
  accumulateStats: (newStats) => set(s => ({
    stats: {
      totalFlows:   s.stats.totalFlows   + newStats.totalFlows,
      totalPackets: s.stats.totalPackets + newStats.totalPackets,
      forwarded:    s.stats.forwarded    + newStats.forwarded,
      blocked:      s.stats.blocked      + newStats.blocked,
    }
  })),

  setLBStats: (lbStats) => set({ lbStats }),
  setFPStats: (fpStats) => set({ fpStats }),

  addTerminalLine: (line) => set(s => ({
    terminalLines: [...s.terminalLines.slice(-80), line]
  })),
  clearTerminal: () => set({ terminalLines: [] }),

  // only show LATEST analysis on map
  setServerLocations: (serverLocations) => set({ serverLocations }),

  // manual clear everything
  clearAll: () => set({
    flows: [],
    stats: { totalFlows: 0, totalPackets: 0, forwarded: 0, blocked: 0 },
    lbStats: [{ id: 0, flows: 0 }, { id: 1, flows: 0 }],
    fpStats: [{ id: 0, pkts: 0 }, { id: 1, pkts: 0 }, { id: 2, pkts: 0 }, { id: 3, pkts: 0 }],
    terminalLines: [],
    serverLocations: [],
  }),

  // kept for backward compat — only clears terminal now
  reset: () => set({ terminalLines: [] }),
}))