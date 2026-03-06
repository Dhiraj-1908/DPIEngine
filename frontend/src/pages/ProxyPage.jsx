import ProxyStatusBanner from '../components/proxy/ProxyStatusBanner'
import ProxyStatsBar     from '../components/proxy/ProxyStatsBar'
import RuleToggles       from '../components/proxy/RuleToggles'
import LivePacketLog     from '../components/proxy/LivePacketLog'
import HowItWorksPanel   from '../components/proxy/HowItWorksPanel'
import { useProxyStore } from '../store/useProxyStore'

export default function ProxyPage() {
  const isConnected = useProxyStore(s => s.isConnected)

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 20px',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#10b981', letterSpacing: '2px', marginBottom: 4 }}>
          LIVE DPI PROXY ENGINE
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Real-time browser traffic interception · SNI-based classification · App blocking
        </div>
      </div>

      {/* Status banner with connect/disconnect */}
      <ProxyStatusBanner />

      {/* Stats — always visible, zeros when disconnected */}
      <ProxyStatsBar />

      {/* Main content */}
      {isConnected ? (
        // Connected: rules + log side by side, how it works below
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
            <RuleToggles />
            <LivePacketLog />
          </div>
          <HowItWorksPanel />
        </>
      ) : (
        // Disconnected: only how it works, no rules (nothing to block yet)
        <HowItWorksPanel />
      )}

    </div>
  )
}