import { useDPIStore } from '../store/useDPIStore'

export default function StatsBar() {
  const { stats, lbStats, fpStats } = useDPIStore()

  const cards = [
    { label: 'TOTAL FLOWS',   value: stats.totalFlows,   color: '#2563eb', icon: '⬡' },
    { label: 'PACKETS',       value: stats.totalPackets, color: '#7c3aed', icon: '◈' },
    { label: 'FORWARDED',     value: stats.forwarded,    color: '#059669', icon: '↑' },
    { label: 'BLOCKED',       value: stats.blocked,      color: '#dc2626', icon: '✕' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--bg-card)', border: `1px solid ${c.color}22`,
          borderRadius: 9, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px' }}>
              {c.label}
            </span>
            <span style={{ color: c.color, fontSize: 13 }}>{c.icon}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: c.color }}>
            {c.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}