import { useEffect, useRef } from 'react'
import { useProxyStore } from '../../store/useProxyStore'
import { getAppStyle } from '../../constants/appColors'

export default function LivePacketLog() {
  const { packets } = useProxyStore()
  const containerRef = useRef(null)
  const userScrolled = useRef(false)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    userScrolled.current = !isAtBottom
  }

  // Auto-scroll to bottom when new packets arrive (unless user scrolled up)
  useEffect(() => {
    if (!userScrolled.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [packets])

  const resumeLive = () => {
    userScrolled.current = false
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }

  // packets array is oldest→newest from background.js (push to end)
  // display as-is: oldest at top, latest at bottom
  const displayed = packets

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '11px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
            LIVE PACKET LOG
          </span>
          {/* Live indicator dot */}
          {packets.length > 0 && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#10b981', display: 'inline-block',
              boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite',
            }} />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {userScrolled.current && (
            <span
              onClick={resumeLive}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#f59e0b', cursor: 'pointer' }}
            >
              ↓ resume live
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            {displayed.length} entries
          </span>
        </div>
      </div>

      {/* Log rows */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ height: 380, overflowY: 'auto', padding: '4px 0' }}
      >
        {displayed.length === 0 ? (
          <div style={{
            padding: '40px 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--text-muted)', textAlign: 'center', lineHeight: 2,
          }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>📡</div>
            <div>Waiting for traffic...</div>
            <div style={{ fontSize: 9, marginTop: 4, opacity: 0.6 }}>Browse any site to see packets appear here</div>
          </div>
        ) : (
          displayed.map((p, i) => {
            const style = getAppStyle ? getAppStyle(p.app) : { color: '#94a3b8' }
            const isBlock = p.action === 'BLOCK'
            const isOther = p.app === 'other'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 16px',
                background: isBlock ? '#ef444408' : 'transparent',
                borderLeft: `2px solid ${isBlock ? '#ef4444' : isOther ? '#334155' : '#10b981'}`,
                marginLeft: 4, marginBottom: 1,
              }}>
                {/* Timestamp */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: 'var(--text-muted)', width: 56, flexShrink: 0,
                }}>
                  {p.time || '--:--:--'}
                </span>

                {/* Action */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                  color: isBlock ? '#ef4444' : '#10b981',
                  width: 50, flexShrink: 0,
                }}>
                  {p.action}
                </span>

                {/* App label */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: isOther ? '#475569' : style.color,
                  width: 68, flexShrink: 0,
                  opacity: isOther ? 0.6 : 1,
                }}>
                  {(p.app || 'other').toUpperCase()}
                </span>

                {/* Hostname */}
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: isOther ? '#475569' : 'var(--text-secondary)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  opacity: isOther ? 0.7 : 1,
                }}>
                  {p.host}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}