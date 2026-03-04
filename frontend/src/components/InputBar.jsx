import { useDPIStore } from '../store/useDPIStore'
import { analyzeDomains } from '../utils/analyzer'
import { PRESETS } from '../constants/signatures'

export default function InputBar() {
  const {
    inputDomains, setInputDomains,
    isAnalyzing, setAnalyzing,
    blockedApps, customBlockedDomains, useRealAPI,
    appendFlows, accumulateStats, setLBStats, setFPStats,
    addTerminalLine, clearTerminal, setServerLocations, clearAll,
  } = useDPIStore()

  async function handleAnalyze() {
    if (!inputDomains.trim() || isAnalyzing) return
    clearTerminal()
    setAnalyzing(true)

    const batchPrefix = Date.now()
    addTerminalLine(`[SYS] New analysis batch — ${new Date().toLocaleTimeString()}`)
    addTerminalLine('[LB]  Load balancer initialized — 2 workers')
    addTerminalLine('[FP]  Fast path threads: 4')
    addTerminalLine('─'.repeat(60))

    await analyzeDomains({
      raw: inputDomains,
      blockedApps, customBlockedDomains, useRealAPI,
      batchPrefix,
      callbacks: {
        onLine: addTerminalLine,
        onFlow: (flows, stats, lbStats, fpStats) => {
            console.log('LOCATIONS:', flows.map(f => f.serverInfo))  // ← ADD THIS
          setLBStats(lbStats)
          setFPStats(fpStats)
          // update map with latest batch only
          setServerLocations(
  flows
    .map(f => f.serverInfo)
    .filter(Boolean)
    .map(s => ({ ...s, lat: Number(s.lat), lon: Number(s.lon) }))
)
        },
        onDone: (flows) => {
          // accumulate — don't replace
          appendFlows(flows)
          accumulateStats({
            totalFlows:   flows.length,
            totalPackets: flows.reduce((a, f) => a + f.packets, 0),
            forwarded:    flows.filter(f => f.action === 'FORWARD').length,
            blocked:      flows.filter(f => f.action === 'BLOCK').length,
          })
          addTerminalLine('─'.repeat(60))
          addTerminalLine(`[SYS] Batch complete — ${flows.length} flows. Total accumulated: see stats.`)
          setAnalyzing(false)
        },
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={inputDomains}
          onChange={e => setInputDomains(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder="youtube.com, tiktok.com, facebook.com  — separate with commas or newlines"
          style={{
            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '10px 14px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{
            background: isAnalyzing ? 'var(--border)' : 'var(--accent-blue)',
            border: 'none', borderRadius: 7, padding: '0 22px',
            color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12,
            fontWeight: 700, cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            letterSpacing: '1px', transition: 'background 0.2s',
          }}
        >
          {isAnalyzing ? 'ANALYZING...' : '▶ ANALYZE'}
        </button>
        <button
          onClick={clearAll}
          disabled={isAnalyzing}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 7, padding: '0 16px', color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
            letterSpacing: '1px',
          }}
        >
          ✕ CLEAR
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>
          PRESETS:
        </span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => setInputDomains(p.domains)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 5, padding: '4px 10px', color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: 9, cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}