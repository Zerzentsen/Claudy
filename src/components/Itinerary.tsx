import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format, eachDayOfInterval, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Trip, DayPlan, Activity, Place } from '../types.ts'
import { ACTIVITY_CATEGORIES } from '../types.ts'
import type { ActivityCategory } from '../types.ts'
import * as storage from '../storage.ts'
import ConfirmModal from './ConfirmModal.tsx'

interface Props {
  trip: Trip
  days: DayPlan[]
  places: Place[]
  onUpdate: () => void
}

export default function Itinerary({ trip, days, places, onUpdate }: Props) {
  const allDates = eachDayOfInterval({
    start: parseISO(trip.startDate),
    end: parseISO(trip.endDate),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          Itinéraire jour par jour
        </h2>
        <span className="text-sm text-slate-500">{allDates.length} jours</span>
      </div>
      {allDates.map((date, idx) => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const dayPlan = days.find((d) => d.date === dateStr)
        return (
          <DayCard
            key={dateStr}
            date={date}
            dayNumber={idx + 1}
            tripId={trip.id}
            dayPlan={dayPlan ?? null}
            places={places}
            onUpdate={onUpdate}
          />
        )
      })}
    </div>
  )
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function detectConflicts(activities: Activity[], currentId?: string): string[] {
  const timed = activities
    .filter((a) => a.startTime && a.endTime && a.id !== currentId)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const conflicts: string[] = []
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      const a = timed[i]
      const b = timed[j]
      if (timeToMinutes(a.endTime) > timeToMinutes(b.startTime)) {
        conflicts.push(`"${a.title}" (${a.startTime}-${a.endTime}) chevauche "${b.title}" (${b.startTime}-${b.endTime})`)
      }
    }
  }
  return conflicts
}

function DayCard({
  date,
  dayNumber,
  tripId,
  dayPlan,
  places,
  onUpdate,
}: {
  date: Date
  dayNumber: number
  tripId: string
  dayPlan: DayPlan | null
  places: Place[]
  onUpdate: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [notes, setNotes] = useState(dayPlan?.notes ?? '')
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const activities = dayPlan?.activities ?? []
  const dateStr = format(date, 'yyyy-MM-dd')
  const conflicts = detectConflicts(activities)

  function ensureDayPlan(): DayPlan {
    if (dayPlan) return dayPlan
    const newDay: DayPlan = {
      id: uuidv4(),
      tripId,
      date: dateStr,
      notes: '',
      activities: [],
    }
    storage.saveDay(newDay)
    onUpdate()
    return newDay
  }

  function handleSaveNotes() {
    const day = ensureDayPlan()
    storage.saveDay({ ...day, notes })
    onUpdate()
  }

  function handleSaveActivity(activity: Activity) {
    const day = ensureDayPlan()
    const existing = day.activities.findIndex((a) => a.id === activity.id)
    const updated = [...day.activities]
    if (existing >= 0) {
      updated[existing] = activity
    } else {
      updated.push({ ...activity, order: updated.length })
    }
    storage.saveDay({ ...day, activities: updated })
    onUpdate()
    setShowForm(false)
    setEditingActivity(null)
  }

  function handleDeleteActivity(activityId: string) {
    if (!dayPlan) return
    const updated = dayPlan.activities.filter((a) => a.id !== activityId)
    storage.saveDay({ ...dayPlan, activities: updated })
    onUpdate()
    setDeleteConfirm(null)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
            J{dayNumber}
          </span>
          <div>
            <p className="font-medium text-slate-900">
              {format(date, 'EEEE d MMMM', { locale: fr })}
            </p>
            <p className="text-sm text-slate-500">
              {activities.length} activité{activities.length !== 1 ? 's' : ''}
              {conflicts.length > 0 && (
                <span className="ml-2 text-amber-600">⚠ {conflicts.length} conflit{conflicts.length !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
        </div>
        <span
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Conflict warnings */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-800 mb-1">Chevauchements horaires :</p>
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-amber-700">{c}</p>
              ))}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Notes du jour
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Notes pour cette journée..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {/* Activities */}
          {activities
            .sort((a, b) => {
              if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
              return a.order - b.order
            })
            .map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg group"
              >
                <span className="text-xl mt-0.5">
                  {ACTIVITY_CATEGORIES[activity.category]?.icon ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm">
                      {activity.title}
                    </p>
                    {activity.startTime && (
                      <span className="text-xs text-slate-400">
                        {activity.startTime}
                        {activity.endTime ? ` - ${activity.endTime}` : ''}
                      </span>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-slate-500 mt-0.5">
                      {activity.description}
                    </p>
                  )}
                  {activity.placeId && (
                    <p className="text-xs text-primary-600 mt-1">
                      📍 {places.find((p) => p.id === activity.placeId)?.name ?? 'Lieu inconnu'}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingActivity(activity)
                      setShowForm(true)
                    }}
                    className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(activity.id)}
                    className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}

          {showForm ? (
            <ActivityForm
              activity={editingActivity}
              existingActivities={activities}
              places={places}
              onSave={handleSaveActivity}
              onCancel={() => {
                setShowForm(false)
                setEditingActivity(null)
              }}
            />
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-dashed border-primary-300 cursor-pointer"
            >
              + Ajouter une activité
            </button>
          )}

          {deleteConfirm && (
            <ConfirmModal
              title="Supprimer l'activité"
              message="Voulez-vous vraiment supprimer cette activité ?"
              onConfirm={() => handleDeleteActivity(deleteConfirm)}
              onCancel={() => setDeleteConfirm(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActivityForm({
  activity,
  existingActivities,
  places,
  onSave,
  onCancel,
}: {
  activity: Activity | null
  existingActivities: Activity[]
  places: Place[]
  onSave: (a: Activity) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(activity?.title ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [startTime, setStartTime] = useState(activity?.startTime ?? '')
  const [endTime, setEndTime] = useState(activity?.endTime ?? '')
  const [category, setCategory] = useState<ActivityCategory>(activity?.category ?? 'activity')
  const [placeId, setPlaceId] = useState(activity?.placeId ?? '')
  const [timeError, setTimeError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (startTime && endTime && endTime <= startTime) {
      setTimeError("L'heure de fin doit être après l'heure de début")
      return
    }

    if (startTime && endTime) {
      const newActivity = { id: activity?.id ?? '', startTime, endTime, title } as Activity
      const others = existingActivities.filter((a) => a.id !== newActivity.id && a.startTime && a.endTime)
      for (const other of others) {
        const newStart = timeToMinutes(startTime)
        const newEnd = timeToMinutes(endTime)
        const otherStart = timeToMinutes(other.startTime)
        const otherEnd = timeToMinutes(other.endTime)
        if (newStart < otherEnd && newEnd > otherStart) {
          setTimeError(`Chevauche "${other.title}" (${other.startTime}-${other.endTime})`)
          return
        }
      }
    }

    setTimeError('')
    onSave({
      id: activity?.id ?? uuidv4(),
      title,
      description,
      startTime,
      endTime,
      category,
      placeId,
      order: activity?.order ?? 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-primary-50 rounded-lg space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'activité *"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ActivityCategory)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(ACTIVITY_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.icon} {val.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— Lieu (optionnel) —</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="time"
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value)
              setTimeError('')
            }}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              timeError ? 'border-red-300' : 'border-slate-200'
            }`}
          />
        </div>
        <div>
          <input
            type="time"
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value)
              setTimeError('')
            }}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              timeError ? 'border-red-300' : 'border-slate-200'
            }`}
          />
        </div>
        {timeError && (
          <p className="col-span-2 text-xs text-red-600">{timeError}</p>
        )}
        <div className="col-span-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer"
        >
          {activity ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}
