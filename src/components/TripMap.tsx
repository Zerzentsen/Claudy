import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Place, DayPlan } from '../types.ts'
import { PLACE_CATEGORIES } from '../types.ts'

// Fix default marker icon issue in bundled apps
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const iconCache = new Map<string, L.DivIcon>()

function createCategoryIcon(emoji: string) {
  if (iconCache.has(emoji)) return iconCache.get(emoji)!
  const icon = L.divIcon({
    html: `<div style="font-size:24px;text-align:center;line-height:32px;">${emoji}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
  iconCache.set(emoji, icon)
  return icon
}

interface Props {
  places: Place[]
  days: DayPlan[]
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap()

  useEffect(() => {
    if (places.length === 0) return
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, places])

  return null
}

export default function TripMap({ places, days }: Props) {
  const placesWithCoords = useMemo(
    () => places.filter((p) => p.lat !== 0 && p.lng !== 0),
    [places]
  )

  const routePoints = useMemo(() => {
    const points: [number, number][] = []
    for (const day of days) {
      for (const activity of day.activities.sort((a, b) => {
        if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
        return a.order - b.order
      })) {
        if (activity.placeId) {
          const place = places.find((p) => p.id === activity.placeId)
          if (place && place.lat !== 0 && place.lng !== 0) {
            points.push([place.lat, place.lng])
          }
        }
      }
    }
    return points
  }, [days, places])

  if (placesWithCoords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-4xl mb-3">🗺️</p>
        <p className="text-slate-500">
          Ajoutez des lieux avec des coordonnées pour les voir sur la carte.
        </p>
        <p className="text-sm text-slate-400 mt-1">
          Rendez-vous dans l'onglet "Lieux" pour en ajouter.
        </p>
      </div>
    )
  }

  const center: [number, number] = [placesWithCoords[0].lat, placesWithCoords[0].lng]

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
      <MapContainer center={center} zoom={12} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds places={placesWithCoords} />

        {placesWithCoords.map((place) => {
          const catInfo = PLACE_CATEGORIES[place.category]
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={createCategoryIcon(catInfo?.icon ?? '📍')}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <strong>{place.name}</strong>
                  <br />
                  <span className="text-xs text-gray-500">
                    {catInfo?.label ?? place.category}
                  </span>
                  {place.address && (
                    <>
                      <br />
                      <span className="text-xs">{place.address}</span>
                    </>
                  )}
                  {place.notes && (
                    <>
                      <br />
                      <em className="text-xs text-gray-400">{place.notes}</em>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: '#2563eb', weight: 3, dashArray: '8 4' }}
          />
        )}
      </MapContainer>
    </div>
  )
}
