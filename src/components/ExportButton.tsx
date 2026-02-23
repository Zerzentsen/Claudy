import { jsPDF } from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Trip, DayPlan, Place, Expense } from '../types.ts'
import { ACTIVITY_CATEGORIES, PLACE_CATEGORIES, EXPENSE_CATEGORIES, CURRENCIES } from '../types.ts'
import * as storage from '../storage.ts'

interface Props {
  trip: Trip
  days: DayPlan[]
  places: Place[]
  expenses: Expense[]
}

export default function ExportButton({ trip, days, places, expenses }: Props) {
  function exportJSON() {
    const data = storage.exportTripData(trip.id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trip.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF() {
    const doc = new jsPDF()
    const currency = CURRENCIES.find((c) => c.code === trip.currency)
    const symbol = currency?.symbol ?? trip.currency
    let y = 20

    function checkPage(needed: number) {
      if (y + needed > 280) {
        doc.addPage()
        y = 20
      }
    }

    // Title
    doc.setFontSize(22)
    doc.setTextColor(37, 99, 235)
    doc.text(trip.name, 14, y)
    y += 8
    doc.setFontSize(12)
    doc.setTextColor(100, 116, 139)
    doc.text(`${trip.destination}`, 14, y)
    y += 6
    doc.text(
      `${format(new Date(trip.startDate), 'd MMMM yyyy', { locale: fr })} - ${format(new Date(trip.endDate), 'd MMMM yyyy', { locale: fr })}`,
      14,
      y
    )
    y += 6
    if (trip.description) {
      doc.setFontSize(10)
      doc.text(trip.description, 14, y, { maxWidth: 180 })
      y += 8
    }
    y += 4

    // Itinerary
    if (days.length > 0) {
      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235)
      doc.text('Itinéraire', 14, y)
      y += 8

      for (const day of days) {
        checkPage(20)
        doc.setFontSize(12)
        doc.setTextColor(15, 23, 42)
        doc.text(format(new Date(day.date), 'EEEE d MMMM', { locale: fr }), 14, y)
        y += 6

        if (day.notes) {
          doc.setFontSize(9)
          doc.setTextColor(100, 116, 139)
          doc.text(day.notes, 18, y, { maxWidth: 170 })
          y += 5
        }

        for (const act of day.activities.sort((a, b) => {
          if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
          return a.order - b.order
        })) {
          checkPage(12)
          const cat = ACTIVITY_CATEGORIES[act.category]
          const time = act.startTime ? `${act.startTime}${act.endTime ? `-${act.endTime}` : ''} ` : ''
          doc.setFontSize(10)
          doc.setTextColor(15, 23, 42)
          doc.text(`${cat?.icon ?? ''} ${time}${act.title}`, 18, y)
          y += 5
          if (act.description) {
            doc.setFontSize(9)
            doc.setTextColor(100, 116, 139)
            doc.text(act.description, 22, y, { maxWidth: 165 })
            y += 5
          }
        }
        y += 3
      }
    }

    // Places
    if (places.length > 0) {
      checkPage(20)
      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235)
      doc.text('Lieux', 14, y)
      y += 8

      for (const place of places) {
        checkPage(15)
        const cat = PLACE_CATEGORIES[place.category]
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text(`${cat?.icon ?? ''} ${place.name}`, 14, y)
        y += 5
        if (place.address) {
          doc.setFontSize(9)
          doc.setTextColor(100, 116, 139)
          doc.text(place.address, 18, y, { maxWidth: 170 })
          y += 4
        }
        if (place.phone) {
          doc.text(`Tel: ${place.phone}`, 18, y)
          y += 4
        }
        y += 2
      }
    }

    // Budget
    if (expenses.length > 0) {
      checkPage(20)
      doc.setFontSize(16)
      doc.setTextColor(37, 99, 235)
      doc.text('Budget', 14, y)
      y += 8

      const total = expenses.reduce((sum, e) => sum + e.amount, 0)
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text(`Total : ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${symbol}`, 14, y)
      y += 8

      for (const expense of expenses) {
        checkPage(10)
        const cat = EXPENSE_CATEGORIES[expense.category]
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text(
          `${cat?.icon ?? ''} ${expense.title} — ${expense.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} ${symbol}`,
          14,
          y
        )
        y += 5
      }
    }

    doc.save(`${trip.name.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportJSON}
        className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        title="Exporter en JSON"
      >
        JSON
      </button>
      <button
        onClick={exportPDF}
        className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
        title="Exporter en PDF"
      >
        PDF
      </button>
    </div>
  )
}
