import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Trip, DayPlan, Place, Expense } from '../types.ts'
import { CURRENCIES } from '../types.ts'
import * as storage from '../storage.ts'
import Itinerary from '../components/Itinerary.tsx'
import TripMap from '../components/TripMap.tsx'
import PlacesList from '../components/PlacesList.tsx'
import Budget from '../components/Budget.tsx'
import ExportButton from '../components/ExportButton.tsx'

type Tab = 'itinerary' | 'map' | 'places' | 'budget'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'itinerary', label: 'Itinéraire', icon: '📅' },
  { key: 'map', label: 'Carte', icon: '🗺️' },
  { key: 'places', label: 'Lieux', icon: '📍' },
  { key: 'budget', label: 'Budget', icon: '💰' },
]

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('itinerary')
  const [trip, setTrip] = useState<Trip | null>(null)
  const [days, setDays] = useState<DayPlan[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])

  useEffect(() => {
    if (!tripId) return
    const t = storage.getTrip(tripId)
    if (!t) {
      navigate('/')
      return
    }
    setTrip(t)
    reload(tripId)
  }, [tripId, navigate])

  function reload(id: string) {
    setDays(storage.getDays(id))
    setPlaces(storage.getPlaces(id))
    setExpenses(storage.getExpenses(id))
  }

  if (!trip || !tripId) return null

  const currency = CURRENCIES.find((c) => c.code === trip.currency)
  const totalBudget = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      {/* Trip header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{trip.name}</h1>
            <p className="text-slate-500">
              {trip.destination} &middot;{' '}
              {new Date(trip.startDate).toLocaleDateString('fr-FR')} →{' '}
              {new Date(trip.endDate).toLocaleDateString('fr-FR')}
            </p>
            {trip.description && (
              <p className="text-sm text-slate-600 mt-1">{trip.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-slate-500">Budget total</p>
              <p className="text-xl font-bold text-primary-700">
                {totalBudget.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })}{' '}
                {currency?.symbol ?? trip.currency}
              </p>
            </div>
            <ExportButton trip={trip} days={days} places={places} expenses={expenses} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'itinerary' && (
        <Itinerary
          trip={trip}
          days={days}
          places={places}
          onUpdate={() => reload(tripId)}
        />
      )}
      {tab === 'map' && <TripMap places={places} days={days} />}
      {tab === 'places' && (
        <PlacesList
          tripId={tripId}
          places={places}
          onUpdate={() => reload(tripId)}
        />
      )}
      {tab === 'budget' && (
        <Budget
          trip={trip}
          expenses={expenses}
          days={days}
          onUpdate={() => reload(tripId)}
        />
      )}
    </div>
  )
}
