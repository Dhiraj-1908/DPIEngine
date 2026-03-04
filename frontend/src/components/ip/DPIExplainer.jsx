import { getDPIInsights } from '../../utils/ipUtils'

export default function DPIExplainer({ data }) {
  const insights = getDPIInsights(data)

  const steps = [
    { label: 'YOUR DEVICE',  icon: '💻', color: '#2563eb' },
    { label: 'ISP ROUTER',   icon: '📡', color: '#7c3aed' },
    { label: 'DPI ENGINE',   icon: '🔬', color: '#f59e0b' },
    { label: 'DESTINATION',  icon: '🌐', color: '#059669' },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          🔬 DPI PACKET FLOW
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        {/* flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, overflowX: 'auto' }}>
          {steps.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: s.color, letterSpacing: '1px',
                }}>{s.label}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ color: '#2563eb', fontSize: 16, margin: '0 4px', marginBottom: 16 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '10px 12px', borderRadius: 7,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {ins.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}