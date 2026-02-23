import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Place, PlaceCategory } from '../types.ts'
import { PLACE_CATEGORIES } from '../types.ts'
import * as storage from '../storage.ts'
import ConfirmModal from './ConfirmModal.tsx'

interface Props {
  tripId: string
  places: Place[]
  onUpdate: () => void
}

export default function PlacesList({ tripId, places, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editPlace, setEditPlace] = useState<Place | null>(null)
  const [filterCat, setFilterCat] = useState<PlaceCategory | ''>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filtered = filterCat ? places.filter((p) => p.category === filterCat) : places

  function handleSave(place: Place) {
    storage.savePlace(place)
    onUpdate()
    setShowForm(false)
    setEditPlace(null)
  }

  function handleDelete(id: string) {
    storage.deletePlace(id)
    onUpdate()
    setDeleteConfirm(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Carnet de lieux</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as PlaceCategory | '')}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tous</option>
            {Object.entries(PLACE_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.icon} {val.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditPlace(null)
              setShowForm(true)
            }}
            className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer"
          >
            + Ajouter un lieu
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-slate-500">Aucun lieu enregistré</p>
          <p className="text-sm text-slate-400 mt-1">
            Ajoutez des hôtels, restaurants, activités...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((place) => {
            const cat = PLACE_CATEGORIES[place.category]
            return (
              <div
                key={place.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat?.icon ?? '📍'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{place.name}</h3>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {cat?.label ?? place.category}
                      </span>
                    </div>
                    {place.address && (
                      <p className="text-sm text-slate-500 mt-1">{place.address}</p>
                    )}
                    {place.notes && (
                      <p className="text-sm text-slate-600 mt-1">{place.notes}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      {place.phone && <span>📞 {place.phone}</span>}
                      {place.website && (
                        <a
                          href={place.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:underline"
                        >
                          🌐 Site web
                        </a>
                      )}
                      {place.lat !== 0 && (
                        <span>
                          📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditPlace(place)
                      setShowForm(true)
                    }}
                    className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(place.id)}
                    className="text-xs px-3 py-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <PlaceForm
          tripId={tripId}
          place={editPlace}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditPlace(null)
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer le lieu"
          message="Voulez-vous vraiment supprimer ce lieu ?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function PlaceForm({
  tripId,
  place,
  onSave,
  onCancel,
}: {
  tripId: string
  place: Place | null
  onSave: (p: Place) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(place?.name ?? '')
  const [address, setAddress] = useState(place?.address ?? '')
  const [category, setCategory] = useState<PlaceCategory>(place?.category ?? 'activity')
  const [lat, setLat] = useState(place?.lat?.toString() ?? '')
  const [lng, setLng] = useState(place?.lng?.toString() ?? '')
  const [notes, setNotes] = useState(place?.notes ?? '')
  const [phone, setPhone] = useState(place?.phone ?? '')
  const [website, setWebsite] = useState(place?.website ?? '')
  const [coordError, setCoordError] = useState('')

  function validateCoords(latVal: string, lngVal: string): boolean {
    if (!latVal && !lngVal) return true
    const latNum = parseFloat(latVal)
    const lngNum = parseFloat(lngVal)
    if (latVal && !lngVal) {
      setCoordError('Longitude requise si la latitude est renseignée')
      return false
    }
    if (!latVal && lngVal) {
      setCoordError('Latitude requise si la longitude est renseignée')
      return false
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setCoordError('Latitude invalide (entre -90 et 90)')
      return false
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setCoordError('Longitude invalide (entre -180 et 180)')
      return false
    }
    setCoordError('')
    return true
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateCoords(lat, lng)) return
    onSave({
      id: place?.id ?? uuidv4(),
      tripId,
      name,
      address,
      category,
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
      notes,
      phone,
      website,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {place ? 'Modifier le lieu' : 'Nouveau lieu'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Hotel Colosseo"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse complète"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PlaceCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(PLACE_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.icon} {val.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Site web</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => {
                  setLat(e.target.value)
                  setCoordError('')
                }}
                placeholder="48.8566"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  coordError ? 'border-red-300' : 'border-slate-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => {
                  setLng(e.target.value)
                  setCoordError('')
                }}
                placeholder="2.3522"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  coordError ? 'border-red-300' : 'border-slate-300'
                }`}
              />
            </div>
            {coordError && (
              <p className="col-span-2 text-xs text-red-600">{coordError}</p>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes sur ce lieu..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer"
            >
              {place ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
