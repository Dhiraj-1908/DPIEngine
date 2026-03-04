import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useDPIStore } from '../store/useDPIStore'

export default function WorldMap() {
  const { serverLocations } = useDPIStore()

  // coerce to numbers — backend may return strings
  const valid = (serverLocations || [])
    .map(l => l ? { ...l, lat: Number(l.lat), lon: Number(l.lon) } : null)
    .filter(l => l && !isNaN(l.lat) && !isNaN(l.lon) && l.lat !== 0 && l.lon !== 0)

  return (
    <div style={{ height: 240, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={[20, 10]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        key={valid.length} // re-mount when locations arrive so fitBounds works
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {valid.map((loc, i) => (
          <CircleMarker
            key={i}
            center={[loc.lat, loc.lon]}
            radius={10}
            pathOptions={{
              color: '#2563eb', fillColor: '#3b82f6',
              fillOpacity: 0.9, weight: 2,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }}>
                <strong>{loc.city || '?'}, {loc.country || '?'}</strong>
                {loc.ip  && <><br /><span style={{ color: '#3b82f6' }}>{loc.ip}</span></>}
                {loc.org && <><br /><span style={{ color: '#64748b', fontSize: 9 }}>{loc.org}</span></>}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {valid.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#94a3b8',
            background: '#05101880', padding: '6px 14px', borderRadius: 6,
          }}>
            Run analysis to see server locations
          </span>
        </div>
      )}
    </div>
  )
}