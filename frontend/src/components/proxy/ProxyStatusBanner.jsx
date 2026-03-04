import { useProxyStore } from '../../store/useProxyStore'

const BTN_STATES = {
  idle:     { label: 'CONNECT EXTENSION',  color: '#f59e0b', bg: '#f59e0b18', border: '#f59e0b44' },
  checking: { label: 'CONNECTING...',      color: '#60a5fa', bg: '#60a5fa18', border: '#60a5fa44' },
  success:  { label: '✓ CONNECTED',        color: '#10b981', bg: '#10b98118', border: '#10b98144' },
  failed:   { label: '✗ NOT FOUND',        color: '#ef4444', bg: '#ef444418', border: '#ef444444' },
}

export default function ProxyStatusBanner() {
  const { isOnline, isConnected, verifyStatus, connect, disconnect } = useProxyStore()

  const btn = BTN_STATES[verifyStatus] || BTN_STATES.idle
  const isChecking = verifyStatus === 'checking'

  return (
    <div style={{
      background: isOnline ? '#05301855' : '#1a0a0055',
      border: `1px solid ${isOnline ? '#05301888' : '#3a150044'}`,
      borderRadius: 10, padding: '14px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    }}>
      {/* Status dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: isOnline ? '#10b981' : '#f59e0b',
          boxShadow: `0 0 8px ${isOnline ? '#10b981' : '#f59e0b'}`,
          animation: 'pulse 2s infinite',
        }} />
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: isOnline ? '#10b981' : '#f59e0b' }}>
            {isOnline ? 'DPI ENGINE ACTIVE' : 'EXTENSION NOT CONNECTED'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
            {isOnline
              ? 'Intercepting browser traffic via Chrome extension'
              : 'Connect the DPI Engine extension to enable live DPI'}
          </div>
        </div>
      </div>

      {/* Right side */}
      {!isConnected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Setup steps */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '8px 14px',
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text-secondary)', lineHeight: 1.8,
          }}>
            <div style={{ color: '#f59e0b', marginBottom: 4 }}>SETUP GUIDE</div>
            <div>1. Download &amp; install the extension below</div>
            <div>2. Chrome → Extensions → Load unpacked</div>
            <div>3. Click Connect Extension →</div>
          </div>

          {/* Connect button */}
          <button
            onClick={connect}
            disabled={isChecking}
            style={{
              background: btn.bg, border: `1px solid ${btn.border}`,
              borderRadius: 7, padding: '8px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: btn.color, cursor: isChecking ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', letterSpacing: '0.05em',
            }}
          >
            {isChecking && (
              <span style={{ display: 'inline-block', marginRight: 6, animation: 'spin 1s linear infinite' }}>⟳</span>
            )}
            {btn.label}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#10b981', opacity: 0.7 }}>
            Chrome Extension ✓
          </div>
          {/* Disconnect button */}
          <button
            onClick={disconnect}
            style={{
              background: '#ef444418', border: '1px solid #ef444444',
              borderRadius: 7, padding: '8px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
              color: '#ef4444', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s', letterSpacing: '0.05em',
            }}
          >
            ✕ DISCONNECT
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}