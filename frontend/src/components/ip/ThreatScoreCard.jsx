import { getThreatLabel } from '../../utils/ipUtils'

export default function ThreatScoreCard({ score }) {
  const { label, color } = getThreatLabel(score)
  const pct   = score / 100
  const r     = 60
  const circ  = 2 * Math.PI * r
  const dash  = pct * circ * 0.75
  const gap   = circ - dash

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '20px 24px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: 16 }}>
        THREAT SCORE
      </div>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        <svg width="160" height="100" viewBox="0 0 160 100">
          {/* bg arc */}
          <circle cx="80" cy="80" r={r} fill="none"
            stroke="#0f2040" strokeWidth="10"
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeDashoffset={circ * 0.125}
            strokeLinecap="round"
            transform="rotate(180 80 80)"
          />
          {/* score arc */}
          <circle cx="80" cy="80" r={r} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${gap + circ * 0.25}`}
            strokeDashoffset={circ * 0.125}
            strokeLinecap="round"
            transform="rotate(180 80 80)"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, letterSpacing: '2px', marginTop: 4 }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}