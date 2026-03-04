import { useProxyStore } from '../../store/useProxyStore'

export default function ProxyStatsBar() {
  const { stats } = useProxyStore()

  const cards = [
    { label: 'TOTAL',     value: stats.total,     color: '#2563eb' },
    { label: 'FORWARDED', value: stats.forwarded,  color: '#10b981' },
    { label: 'BLOCKED',   value: stats.blocked,    color: '#ef4444' },
    { label: 'REQ/MIN',   value: stats.rate || 0,  color: '#f59e0b' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: 'var(--bg-card)', border: `1px solid ${c.color}22`,
          borderRadius: 9, padding: '14px 16px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 6 }}>
            {c.label}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: c.color }}>
            {c.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}