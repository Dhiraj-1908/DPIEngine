import { useState } from 'react'
import { useDPIStore } from '../store/useDPIStore'
import { getAppStyle } from '../constants/appColors'

const APPS = ['youtube','tiktok','instagram','facebook','netflix','twitter','google','discord','reddit','twitch','spotify']

export default function RulesPanel() {
  const { blockedApps, toggleBlockApp, customBlockedDomains, addCustomDomain, removeCustomDomain } = useDPIStore()
  const [custom, setCustom] = useState('')

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '1px' }}>APP RULES</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {APPS.map(app => {
          const style   = getAppStyle(app)
          const blocked = blockedApps.has(app)
          return (
            <div key={app} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px', borderRadius: 6,
              background: blocked ? '#ef444410' : 'var(--bg-surface)',
              border: `1px solid ${blocked ? '#ef444433' : 'var(--border)'}`,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: style.color }}>{style.icon}</span>
                <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{app}</span>
              </div>
              <div
                onClick={() => toggleBlockApp(app)}
                style={{
                  width: 34, height: 18, borderRadius: 9, cursor: 'pointer',
                  background: blocked ? '#ef4444' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2,
                  left: blocked ? 17 : 2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>CUSTOM DOMAINS</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && custom.trim()) { addCustomDomain(custom.trim()); setCustom('') } }}
          placeholder="e.g. ads.example.com"
          style={{
            flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '5px 8px', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: 10, outline: 'none',
          }}
        />
        <button
          onClick={() => { if (custom.trim()) { addCustomDomain(custom.trim()); setCustom('') } }}
          style={{
            background: 'var(--accent-blue)', border: 'none', borderRadius: 5,
            padding: '5px 10px', color: '#fff', cursor: 'pointer', fontSize: 10,
          }}
        >+ ADD</button>
      </div>
      {customBlockedDomains.map(d => (
        <div key={d} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 8px', borderRadius: 5, background: '#ef444410',
          border: '1px solid #ef444433', marginBottom: 4,
        }}>
          <span style={{ color: '#ef4444' }}>{d}</span>
          <button onClick={() => removeCustomDomain(d)} style={{
            background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12,
          }}>✕</button>
        </div>
      ))}
    </div>
  )
}