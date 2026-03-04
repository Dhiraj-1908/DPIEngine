import { useEffect, useRef } from 'react'
import { useProxyStore } from '../../store/useProxyStore'
import { getAppStyle } from '../../constants/appColors'

export default function LivePacketLog() {
  const { packets } = useProxyStore()
  const containerRef = useRef(null)
  const topRef       = useRef(null)
  const bottomRef    = useRef(null)
  const userScrolled = useRef(false)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    userScrolled.current = !atBottom
  }

  // After every render, if user hasn't scrolled up, jump to latest (bottom)
  useEffect(() => {
    if (!userScrolled.current) {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
    }
  })

  const goToTop = () => {
    userScrolled.current = true
    containerRef.current.scrollTop = 0
  }

  const goToBottom = () => {
    userScrolled.current = false
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
            LIVE PACKET LOG
          </span>
          {packets.length > 0 && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {packets.length > 0 && (
            <span onClick={goToTop} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#60a5fa', cursor: 'pointer', userSelect: 'none' }}>
              ↑ top
            </span>
          )}
          {userScrolled.current && (
            <span onClick={goToBottom} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#f59e0b', cursor: 'pointer', userSelect: 'none' }}>
              ↓ live
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            {packets.length} entries
          </span>
        </div>
      </div>

      {/* Log rows — oldest at top, newest at bottom */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: 420, overflowY: 'auto', padding: '4px 0' }}
      >
        <div ref={topRef} style={{ height: 1 }} />

        {packets.length === 0 ? (
          <div style={{
            padding: '40px 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', textAlign: 'center', lineHeight: 2,
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>📡</div>
            <div>Waiting for traffic...</div>
            <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6 }}>Browse any site to see packets appear here</div>
          </div>
        ) : (
          packets.map((p, i) => {
            const appStyle = getAppStyle ? getAppStyle(p.app) : { color: '#94a3b8' }
            const isBlock  = p.action === 'BLOCK'
            const isCustom = p.app === 'custom'
            const labelColor = isCustom ? '#f97316' : appStyle.color
            return (
              <div key={p.seq ?? i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 16px',
                background: isBlock ? '#ef444408' : 'transparent',
                borderLeft: `2px solid ${isBlock ? '#ef4444' : '#10b981'}`,
                marginLeft: 4, marginBottom: 1,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', width: 56, flexShrink: 0 }}>
                  {p.time || '--:--:--'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: isBlock ? '#ef4444' : '#10b981', width: 52, flexShrink: 0 }}>
                  {p.action}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: labelColor, width: 70, flexShrink: 0 }}>
                  {(p.app || 'custom').toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.host}
                </span>
              </div>
            )
          })
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>
    </div>
  )
}