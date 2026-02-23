import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { format, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Trip } from '../types.ts'
import { CURRENCIES } from '../types.ts'
import * as storage from '../storage.ts'

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    setTrips(storage.getTrips())
  }, [])

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce voyage et toutes ses données ?')) return
    storage.deleteTrip(id)
    setTrips(storage.getTrips())
  }

  function handleSave(trip: Trip) {
    storage.saveTrip(trip)
    setTrips(storage.getTrips())
    setShowModal(false)
    setEditTrip(null)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!data.trip || !data.days || !data.places || !data.expenses) {
          setImportError('Fichier JSON invalide')
          return
        }
        storage.importTripData(data)
        setTrips(storage.getTrips())
        setImportError('')
      } catch {
        setImportError('Erreur lors de la lecture du fichier')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const now = new Date()
  const upcoming = trips.filter((t) => new Date(t.startDate) > now)
  const ongoing = trips.filter(
    (t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now
  )
  const past = trips.filter((t) => new Date(t.endDate) < now)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mes Voyages</h1>
          <p className="text-slate-500 mt-1">
            {trips.length === 0
              ? 'Aucun voyage pour le moment'
              : `${trips.length} voyage${trips.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <span>Importer</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => {
              setEditTrip(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
          >
            + Nouveau voyage
          </button>
        </div>
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{importError}</div>
      )}

      {ongoing.length > 0 && (
        <TripSection title="En cours" trips={ongoing} onDelete={handleDelete} onEdit={(t) => { setEditTrip(t); setShowModal(true) }} />
      )}
      {upcoming.length > 0 && (
        <TripSection title="A venir" trips={upcoming} onDelete={handleDelete} onEdit={(t) => { setEditTrip(t); setShowModal(true) }} />
      )}
      {past.length > 0 && (
        <TripSection title="Passés" trips={past} onDelete={handleDelete} onEdit={(t) => { setEditTrip(t); setShowModal(true) }} />
      )}

      {showModal && (
        <TripModal
          trip={editTrip}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditTrip(null)
          }}
        />
      )}
    </div>
  )
}

function TripSection({
  title,
  trips,
  onDelete,
  onEdit,
}: {
  title: string
  trips: Trip[]
  onDelete: (id: string) => void
  onEdit: (trip: Trip) => void
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-slate-700 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}

function TripCard({
  trip,
  onDelete,
  onEdit,
}: {
  trip: Trip
  onDelete: (id: string) => void
  onEdit: (trip: Trip) => void
}) {
  const days = differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1
  const currency = CURRENCIES.find((c) => c.code === trip.currency)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <span className="text-5xl">🌍</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">{trip.name}</h3>
            <p className="text-sm text-slate-500">{trip.destination}</p>
          </div>
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
            {days}j
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          {format(new Date(trip.startDate), 'd MMM yyyy', { locale: fr })} →{' '}
          {format(new Date(trip.endDate), 'd MMM yyyy', { locale: fr })}
        </p>
        {trip.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{trip.description}</p>
        )}
        <p className="text-xs text-slate-400 mt-2">Devise : {currency?.symbol ?? trip.currency}</p>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <Link
            to={`/trip/${trip.id}`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors no-underline"
          >
            Ouvrir
          </Link>
          <button
            onClick={() => onEdit(trip)}
            className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete(trip.id)}
            className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

function TripModal({
  trip,
  onSave,
  onClose,
}: {
  trip: Trip | null
  onSave: (trip: Trip) => void
  onClose: () => void
}) {
  const isEdit = trip !== null
  const [name, setName] = useState(trip?.name ?? '')
  const [destination, setDestination] = useState(trip?.destination ?? '')
  const [description, setDescription] = useState(trip?.description ?? '')
  const [startDate, setStartDate] = useState(trip?.startDate ?? '')
  const [endDate, setEndDate] = useState(trip?.endDate ?? '')
  const [currency, setCurrency] = useState(trip?.currency ?? 'EUR')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    onSave({
      id: trip?.id ?? uuidv4(),
      name,
      destination,
      description,
      startDate,
      endDate,
      currency,
      createdAt: trip?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEdit ? 'Modifier le voyage' : 'Nouveau voyage'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom du voyage *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Road trip en Italie"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination *</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Italie"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Quelques notes sur le voyage..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Début *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fin *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              {isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
