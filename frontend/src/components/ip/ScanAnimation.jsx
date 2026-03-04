import { useEffect, useState } from 'react'

export default function ScanAnimation() {
  const [angle, setAngle] = useState(0)
  const [dots, setDots]   = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setAngle(a => (a + 3) % 360)
      setDots(d => {
        const next = [...d, { x: Math.random() * 160 - 80, y: Math.random() * 160 - 80, age: 0 }]
          .map(p => ({ ...p, age: p.age + 1 }))
          .filter(p => p.age < 30)
        return next
      })
    }, 40)
    return () => clearInterval(timer)
  }, [])

  const rad = angle * Math.PI / 180
  const cx = 100, cy = 100, r = 80

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      <svg width="200" height="200">
        {/* rings */}
        {[80, 60, 40, 20].map(r2 => (
          <circle key={r2} cx={cx} cy={cy} r={r2}
            fill="none" stroke="#0f2040" strokeWidth="1" />
        ))}
        {/* crosshairs */}
        <line x1={cx - 90} y1={cy} x2={cx + 90} y2={cy} stroke="#0f2040" strokeWidth="1" />
        <line x1={cx} y1={cy - 90} x2={cx} y2={cy + 90} stroke="#0f2040" strokeWidth="1" />
        {/* sweep */}
        <defs>
          <radialGradient id="sweep" cx="0%" cy="0%">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"   />
          </radialGradient>
        </defs>
        <path
          d={`M ${cx} ${cy} L ${cx + r * Math.cos(rad - 0.8)} ${cy + r * Math.sin(rad - 0.8)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)} Z`}
          fill="url(#sweep)"
        />
        <line
          x1={cx} y1={cy}
          x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)}
          stroke="#f59e0b" strokeWidth="1.5"
        />
        {/* blips */}
        {dots.map((d, i) => (
          <circle key={i} cx={cx + d.x * 0.9} cy={cy + d.y * 0.9} r={2}
            fill="#f59e0b" opacity={1 - d.age / 30} />
        ))}
        {/* center */}
        <circle cx={cx} cy={cy} r={3} fill="#f59e0b" />
        <text x={cx} y={cy + 100} textAnchor="middle"
          fontFamily="IBM Plex Mono" fontSize="9" fill="#f59e0b" letterSpacing="2">
          SCANNING...
        </text>
      </svg>
    </div>
  )
}