import { useDPIStore } from '../store/useDPIStore'

export default function Header() {
  const { useRealAPI, setUseRealAPI } = useDPIStore()

  return (
    <div style={{
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
      padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '2px' }}>
          DEEP PACKET INSPECTION ENGINE
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Simulates multithreaded DPI pipeline · Load Balancer → Fast Path · Hash-based flow pinning
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {useRealAPI ? 'LIVE API' : 'DEMO MODE'}
        </span>
        <div
          onClick={() => setUseRealAPI(!useRealAPI)}
          style={{
            width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
            background: useRealAPI ? 'var(--accent-green)' : 'var(--border)',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: useRealAPI ? 21 : 3,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
          }} />
        </div>
      </div>
    </div>
  )
}