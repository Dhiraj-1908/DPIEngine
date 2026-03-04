import { useProxyStore } from '../../store/useProxyStore'
import { getAppStyle } from '../../constants/appColors'

export default function RuleToggles() {
  const { rules, toggleRule } = useProxyStore()

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          APP BLOCKING RULES
        </span>
      </div>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {Object.entries(rules).map(([app, blocked]) => {
          const style = getAppStyle(app)
          return (
            <div key={app} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 8,
              background: blocked ? '#ef444410' : 'var(--bg-surface)',
              border: `1px solid ${blocked ? '#ef444440' : 'var(--border)'}`,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18, color: style.color }}>{style.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>
                    {app.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: blocked ? '#ef4444' : '#10b981' }}>
                    {blocked ? 'BLOCKED' : 'ALLOWED'}
                  </div>
                </div>
              </div>
              <div
                onClick={() => toggleRule(app)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: blocked ? '#ef4444' : '#1a3050',
                  position: 'relative', transition: 'background 0.25s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: blocked ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.25s',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}