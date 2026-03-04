import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useDPIStore } from '../store/useDPIStore'

export default function ThreadStatsChart() {
  const { fpStats, lbStats } = useDPIStore()

  const fpData = fpStats.map(f => ({ name: `FP-${f.id}`, packets: f.pkts }))
  const lbData = lbStats.map(l => ({ name: `LB-${l.id}`, flows: l.flows }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>
          FAST PATH — PACKET DISTRIBUTION
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={fpData} barSize={24}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 10 }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              itemStyle={{ color: '#059669' }}
            />
            <Bar dataKey="packets" radius={[3,3,0,0]}>
              {fpData.map((_, i) => <Cell key={i} fill={`hsl(${160 + i * 15}, 60%, 45%)`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '1px' }}>
          LOAD BALANCER — FLOW DISTRIBUTION
        </div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={lbData} barSize={36}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 10 }}
              labelStyle={{ color: 'var(--text-secondary)' }}
              itemStyle={{ color: '#2563eb' }}
            />
            <Bar dataKey="flows" radius={[3,3,0,0]}>
              {lbData.map((_, i) => <Cell key={i} fill={i === 0 ? '#2563eb' : '#7c3aed'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}