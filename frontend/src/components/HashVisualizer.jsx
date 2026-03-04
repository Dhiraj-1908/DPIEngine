import { useState } from 'react'
import { getHashSteps } from '../utils/hash'
import { useDPIStore } from '../store/useDPIStore'

export default function HashVisualizer() {
  const { flows } = useDPIStore()
  const [selected, setSelected] = useState(0)

  const flow = flows[selected]
  if (!flow) return (
    <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, padding: 8 }}>
      Run an analysis to see hash breakdown
    </div>
  )

  const { steps, finalHash } = getHashSteps(flow.domain)

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      {/* domain selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {flows.slice(0, 6).map((f, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            background: selected === i ? 'var(--accent-blue)' : 'var(--bg-surface)',
            border: `1px solid ${selected === i ? 'var(--accent-blue)' : 'var(--border)'}`,
            borderRadius: 4, padding: '3px 8px', color: selected === i ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 9,
          }}>
            {f.domain.slice(0, 16)}
          </button>
        ))}
      </div>

      {/* five-tuple */}
      <div style={{ background: 'var(--bg-surface)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>5-TUPLE INPUT</div>
        <div style={{ color: '#7c3aed' }}>{flow.srcIP}:{flow.srcPort} → {flow.dstIP}:{flow.dstPort} proto={flow.proto}</div>
      </div>

      {/* steps */}
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>DJB2 STEPS (first 6 chars)</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', width: 14 }}>'{s.char}'</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ color: '#2563eb' }}>0x{s.after.toString(16).padStart(8, '0')}</span>
          </div>
        ))}
      </div>

      {/* result */}
      <div style={{ background: '#0a1a2e', borderRadius: 6, padding: '8px 10px' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>FINAL HASH</div>
            <div style={{ color: '#2563eb' }}>0x{flow.hash.toString(16).padStart(8,'0')}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>LB WORKER</div>
            <div style={{ color: '#7c3aed' }}>LB-{flow.lbIdx}</div>
          </div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>FP THREAD</div>
            <div style={{ color: '#059669' }}>FP-{flow.fpIdx}</div>
          </div>
        </div>
      </div>
    </div>
  )
}