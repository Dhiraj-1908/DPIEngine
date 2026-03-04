export default function RawDataView({ data }) {
  const str = JSON.stringify(data, null, 2)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          {'{ }'} RAW JSON
        </span>
      </div>
      <pre style={{
        margin: 0, padding: '14px 16px', overflowX: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 10, lineHeight: 1.7,
        color: 'var(--text-secondary)', background: '#020810',
      }}>
        {str.split('\n').map((line, i) => {
          const isKey = /"[^"]+":/.test(line)
          const isStr = /:\s*"/.test(line)
          const isNum = /:\s*[\d.]+/.test(line)
          const isBool= /:\s*(true|false)/.test(line)
          return (
            <div key={i} style={{
              color: isKey && isBool ? '#f59e0b'
                   : isKey && isNum ? '#2563eb'
                   : isKey && isStr ? '#10b981'
                   : isKey         ? '#7c3aed'
                   : '#64748b',
            }}>{line}</div>
          )
        })}
      </pre>
    </div>
  )
}