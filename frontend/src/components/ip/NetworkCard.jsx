export default function NetworkCard({ data }) {
  const rows = [
    ['ISP',      data.isp,    '#2563eb'],
    ['ORG',      data.org,    '#7c3aed'],
    ['AS',       data.as,     '#059669'],
    ['HOSTNAME', data.reverse || '(no rDNS)', '#64748b'],
    ['MOBILE',   data.mobile ? 'YES' : 'NO', data.mobile ? '#f59e0b' : '#64748b'],
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          🌐 NETWORK / ASN
        </span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(([k, v, c]) => (
          <div key={k}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', letterSpacing: '1.5px', marginBottom: 2 }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: c }}>{v || '—'}</div>
          </div>
        ))}
        <div style={{
          marginTop: 8, padding: '10px 12px',
          background: '#2563eb11', border: '1px solid #2563eb33', borderRadius: 7,
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2563eb', marginBottom: 4 }}>WHAT IS AN ASN?</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Autonomous System Number — a unique ID assigned to each network on the internet.
            ISPs, CDNs, and large companies each have their own AS. DPI engines use ASN
            to identify traffic without inspecting packet contents.
          </div>
        </div>
      </div>
    </div>
  )
}