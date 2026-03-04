import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

export default function LocationCard({ data }) {
  const isPrecise = data.preciseLocation === true

  const rows = [
    ['IP',       data.query],
    ['CITY',     data.city],
    ['REGION',   data.regionName],
    ['COUNTRY',  `${data.country} (${data.countryCode})`],
    ['ZIP',      data.zip || '—'],
    ['TIMEZONE', data.timezone],
    ['COORDS',   `${data.lat?.toFixed(4)}, ${data.lon?.toFixed(4)}`],
    ...(isPrecise ? [['ACCURACY', `±${data.accuracyMeters}m (GPS)`]] : []),
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          📍 LOCATION
        </span>
        {isPrecise && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
            color: '#10b981', background: '#10b98118',
            border: '1px solid #10b98144', borderRadius: 4,
            padding: '2px 7px', letterSpacing: '0.08em',
          }}>
            ⊕ GPS · ±{data.accuracyMeters}m
          </span>
        )}
      </div>

      {/* Map */}
      {data.lat && (
        <div style={{ height: 180 }}>
          <MapContainer
            center={[data.lat, data.lon]}
            zoom={isPrecise ? 15 : 6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <CircleMarker
              center={[data.lat, data.lon]}
              radius={isPrecise ? 10 : 8}
              pathOptions={{
                color:       isPrecise ? '#10b981' : '#f59e0b',
                fillColor:   isPrecise ? '#10b981' : '#f59e0b',
                fillOpacity: 0.9,
              }}
            >
              <Tooltip permanent>
                {isPrecise ? `📍 You (±${data.accuracyMeters}m)` : data.city}
              </Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      )}

      {/* Data rows */}
      <div style={{ padding: '12px 16px' }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>
              {k}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: k === 'ACCURACY' ? '#10b981' : 'var(--text-primary)',
            }}>
              {v}
            </span>
          </div>
        ))}
      </div>

    </div>
  )
}