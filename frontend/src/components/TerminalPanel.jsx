import { useEffect, useRef } from 'react'
import { useDPIStore } from '../store/useDPIStore'

export default function TerminalPanel() {
  const { terminalLines } = useDPIStore()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLines])

  return (
    <div style={{
      background: '#020810', borderRadius: 7, padding: '12px 14px',
      height: 280, overflowY: 'auto', fontFamily: 'var(--font-mono)',
      fontSize: 10, lineHeight: 1.7,
    }}>
      {terminalLines.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>
          {'>'} Waiting for analysis...<span style={{ animation: 'blink 1s infinite' }}>█</span>
        </div>
      ) : (
        terminalLines.map((line, i) => (
          <div key={i} style={{
            color: line.includes('DROP') ? '#ef4444'
                 : line.includes('FWD')  ? '#10b981'
                 : line.includes('[SYS]') ? '#7c3aed'
                 : line.includes('[LB]') || line.includes('[FP]') ? '#2563eb'
                 : '#64748b',
          }}>
            {line}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}