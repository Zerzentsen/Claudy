export interface Trip {
  id: string
  name: string
  description: string
  destination: string
  startDate: string
  endDate: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface DayPlan {
  id: string
  tripId: string
  date: string
  notes: string
  activities: Activity[]
}

export interface Activity {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  placeId: string
  category: ActivityCategory
  order: number
}

export type ActivityCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'activity'
  | 'shopping'
  | 'other'

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; icon: string }> = {
  transport: { label: 'Transport', icon: '🚗' },
  accommodation: { label: 'Hébergement', icon: '🏨' },
  food: { label: 'Restaurant', icon: '🍽️' },
  activity: { label: 'Activité', icon: '🎯' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  other: { label: 'Autre', icon: '📌' },
}

export interface Place {
  id: string
  tripId: string
  name: string
  address: string
  lat: number
  lng: number
  category: PlaceCategory
  notes: string
  phone: string
  website: string
}

export type PlaceCategory =
  | 'hotel'
  | 'restaurant'
  | 'activity'
  | 'transport'
  | 'shopping'
  | 'other'

export const PLACE_CATEGORIES: Record<PlaceCategory, { label: string; icon: string }> = {
  hotel: { label: 'Hôtel', icon: '🏨' },
  restaurant: { label: 'Restaurant', icon: '🍽️' },
  activity: { label: 'Activité', icon: '🎯' },
  transport: { label: 'Transport', icon: '🚗' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  other: { label: 'Autre', icon: '📌' },
}

export interface Expense {
  id: string
  tripId: string
  dayId: string
  title: string
  amount: number
  currency: string
  category: ExpenseCategory
  date: string
  notes: string
}

export type ExpenseCategory =
  | 'accommodation'
  | 'transport'
  | 'food'
  | 'activity'
  | 'shopping'
  | 'other'

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: string }> = {
  accommodation: { label: 'Hébergement', icon: '🏨' },
  transport: { label: 'Transport', icon: '🚗' },
  food: { label: 'Nourriture', icon: '🍽️' },
  activity: { label: 'Activité', icon: '🎯' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  other: { label: 'Autre', icon: '📌' },
}

export const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'USD', symbol: '$', label: 'Dollar US' },
  { code: 'GBP', symbol: '£', label: 'Livre Sterling' },
  { code: 'CHF', symbol: 'CHF', label: 'Franc Suisse' },
  { code: 'JPY', symbol: '¥', label: 'Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Dollar Canadien' },
  { code: 'MAD', symbol: 'MAD', label: 'Dirham Marocain' },
  { code: 'THB', symbol: '฿', label: 'Baht Thaïlandais' },
]
