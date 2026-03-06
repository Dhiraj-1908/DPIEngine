import { useState } from 'react'
import Header         from './components/Header'
import InputBar       from './components/InputBar'
import StatsBar       from './components/StatsBar'
import PipelineViz    from './components/PipelineViz'
import WorldMap       from './components/WorldMap'
import TabPanel       from './components/TabPanel'
import FlowTable      from './components/FlowTable'
import IPIntelligence from './pages/IPIntelligence'
import ProxyPage      from './pages/ProxyPage'
import NetworkTracer  from './pages/NetworkTracer'

const NAV = [
  { id: 'dpi',     label: '🔬  DPI PLAYGROUND',   sub: 'PCAP · Load Balancer · Fast Path',      accent: '#2563eb' },
  { id: 'ip',      label: '🔍  IP INTELLIGENCE',   sub: 'Geolocation · Threat · VPN · ASN',      accent: '#f59e0b' },
  { id: 'proxy',   label: '⚡  LIVE PROXY',        sub: 'Real-time browser traffic interception', accent: '#10b981' },
  { id: 'tracer',  label: '◈  NETWORK TRACER',    sub: 'DNS · TLS · Auth · Packet Flow',         accent: '#a855f7' },
]

const NAV_HEIGHT = 48

export default function App() {
  const [page, setPage] = useState('dpi')
  const accent = NAV.find(n => n.id === page)?.accent || '#2563eb'

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* Global Nav */}
      <nav style={{
        background:   'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        padding:      '0 28px',
        display:      'flex',
        alignItems:   'stretch',
        flexShrink:   0,
        zIndex:       200,
        height:       NAV_HEIGHT,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingRight: 24, marginRight: 4,
          borderRight: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 7,
            background: `linear-gradient(135deg, ${accent}cc, ${accent}55)`,
            border: `1px solid ${accent}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, transition: 'all 0.3s',
          }}>
            {page === 'dpi' ? '🔬' : page === 'ip' ? '🔍' : page === 'proxy' ? '⚡' : '◈'}
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700, fontSize: 13, letterSpacing: '1.5px',
            color: accent, transition: 'color 0.3s',
          }}>DPI Engine</div>
        </div>

        {/* Tabs */}
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            background:     'transparent',
            border:         'none',
            borderBottom:   `2px solid ${page === n.id ? n.accent : 'transparent'}`,
            padding:        '0 20px',
            cursor:         'pointer',
            display:        'flex',
            flexDirection:  'column',
            justifyContent: 'center',
            gap:            2,
            transition:     'all 0.15s',
            minWidth:       160,
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize:   11, fontWeight: 700, letterSpacing: '0.5px',
              color:      page === n.id ? n.accent : 'var(--text-muted)',
              transition: 'color 0.15s',
            }}>{n.label}</span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize:   8, letterSpacing: '0.3px',
              color:      page === n.id ? n.accent + 'aa' : 'var(--text-muted)',
            }}>{n.sub}</span>
          </button>
        ))}
      </nav>

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {page === 'dpi'    && <DPIPage />}
        {page === 'ip'     && <IPIntelligence />}
        {page === 'proxy'  && <ProxyPage />}
        {page === 'tracer' && <NetworkTracer />}
      </div>

    </div>
  )
}

function DPIPage() {
  return (
    <>
      <Header />
      <main style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <InputBar />
        <StatsBar />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SectionBox title="LB / FP PIPELINE" subtitle="Mirrors dpi_mt.cpp architecture" legend>
              <PipelineViz />
            </SectionBox>
            <SectionBox title="SERVER LOCATIONS" subtitle="Geolocation of analyzed domains">
              <WorldMap />
            </SectionBox>
          </div>
          <div style={{ minHeight: 600 }}>
            <TabPanel />
          </div>
        </div>
        <FlowTable />
      </main>
    </>
  )
}

function SectionBox({ title, subtitle, legend, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        padding: '11px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1.5px' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>
          )}
        </div>
        {legend && (
          <div style={{ display: 'flex', gap: 10 }}>
            {[['#10b981','FWD'],['#ef4444','DROP'],['#2563eb','ACTIVE']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-secondary)' }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '0 12px 12px' }}>{children}</div>
    </div>
  )
}