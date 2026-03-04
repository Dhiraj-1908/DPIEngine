export default function VPNCard({ data }) {
  const flags = [
    { key: 'proxy',   label: 'PROXY',   icon: '🔀', active: data.proxy,   color: '#f59e0b', desc: 'Traffic routed through intermediary' },
    { key: 'vpn',     label: 'VPN',     icon: '🔐', active: data.vpn,     color: '#7c3aed', desc: 'Encrypted tunnel detected' },
    { key: 'tor',     label: 'TOR',     icon: '🧅', active: data.tor,     color: '#ef4444', desc: 'Onion routing — 3+ relays' },
    { key: 'hosting', label: 'HOSTING', icon: '🖥️', active: data.hosting, color: '#2563eb', desc: 'Datacenter / cloud provider IP' },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          🔍 VPN / PROXY DETECTION
        </span>
      </div>
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {flags.map(f => (
          <div key={f.key} style={{
            padding: '12px 14px', borderRadius: 8,
            background: f.active ? `${f.color}15` : 'var(--bg-surface)',
            border: `1px solid ${f.active ? f.color + '44' : 'var(--border)'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                color: f.active ? f.color : '#64748b',
                background: f.active ? `${f.color}22` : '#64748b22',
                padding: '2px 7px', borderRadius: 3,
              }}>
                {f.active ? 'DETECTED' : 'CLEAN'}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: f.active ? f.color : 'var(--text-muted)', fontWeight: 700 }}>
              {f.label}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}