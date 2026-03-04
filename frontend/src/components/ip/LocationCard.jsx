import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'

export default function LocationCard({ data }) {
  const rows = [
    ['IP',       data.query],
    ['CITY',     data.city],
    ['REGION',   data.regionName],
    ['COUNTRY',  `${data.country} (${data.countryCode})`],
    ['ZIP',      data.zip || '—'],
    ['TIMEZONE', data.timezone],
    ['COORDS',   `${data.lat?.toFixed(4)}, ${data.lon?.toFixed(4)}`],
  ]

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '2px' }}>
          📍 LOCATION
        </span>
      </div>
      {data.lat && (
        <div style={{ height: 160 }}>
          <MapContainer center={[data.lat, data.lon]} zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
            <CircleMarker center={[data.lat, data.lon]} radius={8}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.9 }}>
              <Tooltip permanent>{data.city}</Tooltip>
            </CircleMarker>
          </MapContainer>
        </div>
      )}
      <div style={{ padding: '12px 16px' }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>{k}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}