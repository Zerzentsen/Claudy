import type { Trip, DayPlan, Place, Expense } from './types'

const KEYS = {
  trips: 'voyageur_trips',
  days: 'voyageur_days',
  places: 'voyageur_places',
  expenses: 'voyageur_expenses',
} as const

function load<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) as T[] : []
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// --- Trips ---

export function getTrips(): Trip[] {
  return load<Trip>(KEYS.trips).sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )
}

export function getTrip(id: string): Trip | undefined {
  return load<Trip>(KEYS.trips).find((t) => t.id === id)
}

export function saveTrip(trip: Trip): void {
  const trips = load<Trip>(KEYS.trips)
  const idx = trips.findIndex((t) => t.id === trip.id)
  if (idx >= 0) {
    trips[idx] = trip
  } else {
    trips.push(trip)
  }
  save(KEYS.trips, trips)
}

export function deleteTrip(id: string): void {
  save(KEYS.trips, load<Trip>(KEYS.trips).filter((t) => t.id !== id))
  save(KEYS.days, load<DayPlan>(KEYS.days).filter((d) => d.tripId !== id))
  save(KEYS.places, load<Place>(KEYS.places).filter((p) => p.tripId !== id))
  save(KEYS.expenses, load<Expense>(KEYS.expenses).filter((e) => e.tripId !== id))
}

// --- Day Plans ---

export function getDays(tripId: string): DayPlan[] {
  return load<DayPlan>(KEYS.days)
    .filter((d) => d.tripId === tripId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function saveDay(day: DayPlan): void {
  const days = load<DayPlan>(KEYS.days)
  const idx = days.findIndex((d) => d.id === day.id)
  if (idx >= 0) {
    days[idx] = day
  } else {
    days.push(day)
  }
  save(KEYS.days, days)
}

export function deleteDay(id: string): void {
  save(KEYS.days, load<DayPlan>(KEYS.days).filter((d) => d.id !== id))
}

// --- Places ---

export function getPlaces(tripId: string): Place[] {
  return load<Place>(KEYS.places).filter((p) => p.tripId === tripId)
}

export function savePlace(place: Place): void {
  const places = load<Place>(KEYS.places)
  const idx = places.findIndex((p) => p.id === place.id)
  if (idx >= 0) {
    places[idx] = place
  } else {
    places.push(place)
  }
  save(KEYS.places, places)
}

export function deletePlace(id: string): void {
  save(KEYS.places, load<Place>(KEYS.places).filter((p) => p.id !== id))
}

// --- Expenses ---

export function getExpenses(tripId: string): Expense[] {
  return load<Expense>(KEYS.expenses)
    .filter((e) => e.tripId === tripId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function saveExpense(expense: Expense): void {
  const expenses = load<Expense>(KEYS.expenses)
  const idx = expenses.findIndex((e) => e.id === expense.id)
  if (idx >= 0) {
    expenses[idx] = expense
  } else {
    expenses.push(expense)
  }
  save(KEYS.expenses, expenses)
}

export function deleteExpense(id: string): void {
  save(KEYS.expenses, load<Expense>(KEYS.expenses).filter((e) => e.id !== id))
}

// --- Export / Import ---

export function exportTripData(tripId: string) {
  return {
    trip: getTrip(tripId),
    days: getDays(tripId),
    places: getPlaces(tripId),
    expenses: getExpenses(tripId),
  }
}

function validateImportData(data: unknown): { valid: true; data: { trip: Trip; days: DayPlan[]; places: Place[]; expenses: Expense[] } } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Le fichier ne contient pas de données valides' }
  }

  const d = data as Record<string, unknown>

  if (!d.trip || typeof d.trip !== 'object') {
    return { valid: false, error: 'Données de voyage manquantes' }
  }

  const trip = d.trip as Record<string, unknown>
  if (!trip.id || !trip.name || !trip.startDate || !trip.endDate) {
    return { valid: false, error: 'Le voyage est incomplet (id, nom ou dates manquants)' }
  }

  if (!Array.isArray(d.days)) {
    return { valid: false, error: 'Les données des jours sont invalides' }
  }

  if (!Array.isArray(d.places)) {
    return { valid: false, error: 'Les données des lieux sont invalides' }
  }

  if (!Array.isArray(d.expenses)) {
    return { valid: false, error: 'Les données des dépenses sont invalides' }
  }

  return {
    valid: true,
    data: {
      trip: d.trip as Trip,
      days: d.days as DayPlan[],
      places: d.places as Place[],
      expenses: d.expenses as Expense[],
    },
  }
}

export function importTripData(data: unknown): { success: true } | { success: false; error: string } {
  const result = validateImportData(data)
  if (!result.valid) {
    return { success: false, error: result.error }
  }

  const { trip, days, places, expenses } = result.data
  saveTrip(trip)
  days.forEach(saveDay)
  places.forEach(savePlace)
  expenses.forEach(saveExpense)

  return { success: true }
}
