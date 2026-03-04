import { useIPStore } from '../store/useIPStore'
import IPSearchBar    from '../components/ip/IPSearchBar'
import ScanAnimation  from '../components/ip/ScanAnimation'
import ThreatScoreCard from '../components/ip/ThreatScoreCard'
import LocationCard   from '../components/ip/LocationCard'
import NetworkCard    from '../components/ip/NetworkCard'
import VPNCard        from '../components/ip/VPNCard'
import DPIExplainer   from '../components/ip/DPIExplainer'
import RawDataView    from '../components/ip/RawDataView'

const VIEWS = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'network',  label: 'NETWORK'  },
  { id: 'dpi',      label: 'DPI VIEW' },
  { id: 'raw',      label: 'RAW JSON' },
]

export default function IPIntelligence() {
  const { result, isScanning, error, activeView, setActiveView } = useIPStore()

  return (
    <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* header */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 20px',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f59e0b', letterSpacing: '2px', marginBottom: 4 }}>
          IP INTELLIGENCE ENGINE
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Geolocation · ASN · VPN/Proxy Detection · Threat Scoring · DPI Insights
        </div>
      </div>

      {/* search */}
      <IPSearchBar />

      {/* scanning animation */}
      {isScanning && <ScanAnimation />}

      {/* error */}
      {error && (
        <div style={{
          background: '#ef444415', border: '1px solid #ef444440',
          borderRadius: 8, padding: '12px 16px',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ef4444',
        }}>
          ✕ {error}
        </div>
      )}

      {/* results */}
      {result && !isScanning && (
        <>
          {/* view tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {VIEWS.map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)} style={{
                background: activeView === v.id ? '#f59e0b22' : 'var(--bg-card)',
                border: `1px solid ${activeView === v.id ? '#f59e0b55' : 'var(--border)'}`,
                borderRadius: 6, padding: '6px 16px', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: activeView === v.id ? '#f59e0b' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}>{v.label}</button>
            ))}
          </div>

          {/* overview */}
          {activeView === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <ThreatScoreCard score={result.threatScore} />
                <VPNCard data={result} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <LocationCard data={result} />
              </div>
            </div>
          )}

          {/* network */}
          {activeView === 'network' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <NetworkCard data={result} />
              <VPNCard data={result} />
            </div>
          )}

          {/* dpi */}
          {activeView === 'dpi' && (
            <DPIExplainer data={result} />
          )}

          {/* raw */}
          {activeView === 'raw' && (
            <RawDataView data={result} />
          )}
        </>
      )}

      {/* empty state */}
      {!result && !isScanning && !error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 0', gap: 12,
        }}>
          <div style={{ fontSize: 48 }}>🔍</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '2px' }}>
            ENTER AN IP OR CLICK SCAN MY IP
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Try: 8.8.8.8 (Google DNS) · 1.1.1.1 (Cloudflare) · 104.16.132.229 (Cloudflare CDN)
          </div>
        </div>
      )}
    </div>
  )
}