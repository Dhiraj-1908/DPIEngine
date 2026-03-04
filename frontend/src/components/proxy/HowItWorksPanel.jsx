export default function HowItWorksPanel() {
  const steps = [
    {
      n: '01', color: '#2563eb', icon: '🌐',
      title: 'Browser makes a request',
      desc: 'Every time you open a site, your browser fires an HTTP/HTTPS request. The Chrome extension sits in the network stack and intercepts it via the webRequest API — before any data leaves your machine.',
    },
    {
      n: '02', color: '#7c3aed', icon: '🔬',
      title: 'Hostname extracted & classified',
      desc: 'The extension reads the request hostname and runs it through app signature matching — identical to ISP-level SNI-based DPI. No TLS decryption needed: classification happens before the handshake.',
    },
    {
      n: '03', color: '#ef4444', icon: '🚫',
      title: 'Blocked before TCP connects',
      desc: 'If the app is in your block list, declarativeNetRequest cancels the request immediately. The browser never opens a TCP connection to the server — same as a firewall DROP at the network edge.',
    },
    {
      n: '04', color: '#10b981', icon: '📡',
      title: 'Allowed traffic logged live',
      desc: 'Forwarded requests are logged to chrome.storage and streamed to this UI via chrome.runtime.sendMessage every 1.5s. The Live Packet Log gives you real-time visibility into your browser\'s traffic — like tcpdump for the browser.',
    },
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          HOW THE CHROME EXTENSION DPI WORKS
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 8, color: '#7c3aed',
          background: '#7c3aed22', border: '1px solid #7c3aed44',
          padding: '1px 6px', borderRadius: 4,
        }}>
          Manifest V3 · declarativeNetRequest
        </span>
      </div>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {steps.map(s => (
          <div key={s.n} style={{
            padding: '14px 16px', borderRadius: 8,
            background: 'var(--bg-surface)', border: `1px solid ${s.color}33`,
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                color: s.color, background: `${s.color}22`,
                padding: '2px 7px', borderRadius: 4,
              }}>{s.n}</span>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: s.color, fontWeight: 700, marginBottom: 6 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {s.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Tech badges */}
      <div style={{
        padding: '10px 16px', borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {['webRequest API', 'declarativeNetRequest', 'chrome.storage', 'chrome.runtime.sendMessage', 'SNI Classification', 'No TLS Decryption'].map(tag => (
          <span key={tag} style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: 'var(--text-muted)', background: 'var(--bg-surface)',
            border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4,
          }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}