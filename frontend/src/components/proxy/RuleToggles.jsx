import { useState } from 'react'
import { useProxyStore } from '../../store/useProxyStore'
import { getAppStyle } from '../../constants/appColors'

export default function RuleToggles() {
  const { rules, toggleRule, customBlocked, addCustomBlock, removeCustomBlock } = useProxyStore()
  const [newDomain, setNewDomain] = useState('')

  const handleAdd = () => {
    const d = newDomain.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
    if (!d || customBlocked.includes(d)) return
    addCustomBlock(d)
    setNewDomain('')
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          APP BLOCKING RULES
        </span>
        {customBlocked.length > 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#475569' }}>
            {customBlocked.length} custom
          </span>
        )}
      </div>

      <div style={{
        padding: 16,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 10,
        maxHeight: 440,
        overflowY: 'auto',
      }}>
        {/* Built-in apps */}
        {Object.entries(rules)
          .filter(([app]) => !customBlocked.includes(app))
          .map(([app, blocked]) => {
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
                <div onClick={() => toggleRule(app)} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: blocked ? '#ef4444' : '#1a3050',
                  position: 'relative', transition: 'background 0.25s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: blocked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.25s',
                  }} />
                </div>
              </div>
            )
          })}

        {/* Custom domains */}
        {customBlocked.map(d => {
          const blocked = rules[d] !== false
          return (
            <div key={d} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', borderRadius: 8,
              background: blocked ? '#ef444410' : 'var(--bg-surface)',
              border: `1px solid ${blocked ? '#ef444440' : 'var(--border)'}`,
              transition: 'all 0.2s', gap: 6,
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🌐</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)',
                    fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: blocked ? '#ef4444' : '#10b981' }}>
                    {blocked ? 'BLOCKED' : 'ALLOWED'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div onClick={() => toggleRule(d)} style={{
                  width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                  background: blocked ? '#ef4444' : '#1a3050',
                  position: 'relative', transition: 'background 0.25s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: blocked ? 23 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.25s',
                  }} />
                </div>
                <div onClick={() => removeCustomBlock(d)} style={{
                  width: 24, height: 24, borderRadius: 5, cursor: 'pointer',
                  background: '#ef444418', border: '1px solid #ef444440',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ef4444', fontSize: 14, fontWeight: 700,
                }}>×</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add domain input */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1px' }}>
          ADD CUSTOM DOMAIN &nbsp;
          <span style={{ color: customBlocked.length >= 30 ? '#ef4444' : '#334155' }}>({customBlocked.length}/30)</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. sarkarinaukri.com"
            disabled={customBlocked.length >= 30}
            style={{
              flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 12px',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button onClick={handleAdd} disabled={customBlocked.length >= 30} style={{
            background: '#ef444420', border: '1px solid #ef444455',
            borderRadius: 6, padding: '7px 14px',
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
            color: '#ef4444', cursor: 'pointer', whiteSpace: 'nowrap',
            opacity: customBlocked.length >= 30 ? 0.4 : 1,
          }}>+ BLOCK</button>
        </div>
      </div>

    </div>
  )
}