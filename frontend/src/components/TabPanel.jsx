import { useState } from 'react'
import TerminalPanel     from './TerminalPanel'
import HashVisualizer    from './HashVisualizer'
import RulesPanel        from './RulesPanel'
import ThreadStatsChart  from './ThreadStatsChart'

const TABS = [
  { id: 'terminal', label: 'TERMINAL' },
  { id: 'hash',     label: 'HASH VIZ' },
  { id: 'rules',    label: 'RULES'    },
  { id: 'stats',    label: 'STATS'    },
]

export default function TabPanel() {
  const [active, setActive] = useState('terminal')

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', height: '100%',
    }}>
      {/* tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            background: 'transparent',
            borderBottom: `2px solid ${active === t.id ? 'var(--accent-blue)' : 'transparent'}`,
            border: 'none', padding: '10px 18px', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '1px',
            color: active === t.id ? 'var(--accent-blue)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* content */}
      <div style={{ padding: 14 }}>
        {active === 'terminal' && <TerminalPanel />}
        {active === 'hash'     && <HashVisualizer />}
        {active === 'rules'    && <RulesPanel />}
        {active === 'stats'    && <ThreadStatsChart />}
      </div>
    </div>
  )
}