import { useDPIStore } from '../store/useDPIStore'
import { getAppStyle } from '../constants/appColors'

export default function FlowTable() {
  const { flows } = useDPIStore()
  if (!flows.length) return null

  const cols = ['DOMAIN','APP','PROTOCOL','HASH','LB→FP','PACKETS','LATENCY','ACTION']

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '1.5px' }}>
          FLOW TABLE — {flows.length} ENTRIES
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {cols.map(c => (
                <th key={c} style={{
                  padding: '8px 14px', textAlign: 'left',
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: 'var(--text-muted)', letterSpacing: '1px', fontWeight: 600,
                }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flows.map((f, i) => {
              const style = getAppStyle(f.app)
              return (
                <tr key={f.id} style={{
                  borderBottom: '1px solid var(--border)',
                  background: i % 2 === 0 ? 'transparent' : '#ffffff04',
                }}>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)' }}>{f.domain}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{
                      background: style.bg, color: style.color,
                      padding: '2px 7px', borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    }}>{f.app.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
  <span style={{ color: '#7c3aed' }}>{f.protocol}</span>
  {f.realData && (
    <span style={{
      marginLeft: 6, fontSize: 7, color: '#10b981',
      background: '#10b98115', padding: '1px 5px', borderRadius: 3,
    }}>LIVE</span>
  )}
</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#2563eb' }}>0x{f.hash.toString(16).padStart(8,'0')}</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>LB{f.lbIdx}→FP{f.fpIdx}</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{f.packets}</td>
                  <td style={{ padding: '8px 14px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{f.latency}ms</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{
                      background: f.action === 'BLOCK' ? '#ef444420' : '#10b98120',
                      color:      f.action === 'BLOCK' ? '#ef4444'   : '#10b981',
                      padding: '2px 8px', borderRadius: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                    }}>{f.action}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}