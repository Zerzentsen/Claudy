import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Trip, Expense, DayPlan, ExpenseCategory } from '../types.ts'
import { EXPENSE_CATEGORIES, CURRENCIES } from '../types.ts'
import * as storage from '../storage.ts'
import ConfirmModal from './ConfirmModal.tsx'

interface Props {
  trip: Trip
  expenses: Expense[]
  days: DayPlan[]
  onUpdate: () => void
}

export default function Budget({ trip, expenses, days, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [filterCat, setFilterCat] = useState<ExpenseCategory | ''>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const currency = CURRENCIES.find((c) => c.code === trip.currency)
  const symbol = currency?.symbol ?? trip.currency

  const filtered = filterCat ? expenses.filter((e) => e.category === filterCat) : expenses
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0)
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  function handleSave(expense: Expense) {
    const matchingDay = days.find((d) => d.date === expense.date)
    storage.saveExpense({ ...expense, dayId: matchingDay?.id ?? '' })
    onUpdate()
    setShowForm(false)
    setEditExpense(null)
  }

  function handleDelete(id: string) {
    storage.deleteExpense(id)
    onUpdate()
    setDeleteConfirm(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Budget</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value as ExpenseCategory | '')}
            className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes</option>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
              <option key={key} value={key}>
                {val.icon} {val.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditExpense(null)
              setShowForm(true)
            }}
            className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 cursor-pointer"
          >
            + Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold text-primary-700">
            {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {symbol}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Nb dépenses</p>
          <p className="text-2xl font-bold text-slate-800">{expenses.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Moyenne/jour</p>
          <p className="text-2xl font-bold text-slate-800">
            {days.length > 0
              ? (total / Math.max(days.length, 1)).toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '0,00'}{' '}
            {symbol}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Plus grosse</p>
          <p className="text-2xl font-bold text-slate-800">
            {expenses.length > 0
              ? Math.max(...expenses.map((e) => e.amount)).toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                })
              : '0,00'}{' '}
            {symbol}
          </p>
        </div>
      </div>

      {/* By category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Par catégorie</h3>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, amount]) => {
                const info = EXPENSE_CATEGORIES[cat as ExpenseCategory]
                const pct = total > 0 ? (amount / total) * 100 : 0
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(filterCat === cat ? '' : cat as ExpenseCategory)}
                    className={`w-full flex items-center gap-3 p-1 rounded-lg transition-colors cursor-pointer ${
                      filterCat === cat ? 'bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg w-8 text-center">{info?.icon ?? '📌'}</span>
                    <span className="text-sm text-slate-700 w-24 text-left">
                      {info?.label ?? cat}
                    </span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-28 text-right">
                      {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {symbol}
                    </span>
                    <span className="text-xs text-slate-400 w-12 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      )}

      {/* Filtered indicator */}
      {filterCat && (
        <div className="flex items-center justify-between mb-4 px-3 py-2 bg-primary-50 rounded-lg">
          <span className="text-sm text-primary-700">
            {EXPENSE_CATEGORIES[filterCat].icon} {EXPENSE_CATEGORIES[filterCat].label} : {filtered.length} dépense{filtered.length !== 1 ? 's' : ''} — {filteredTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {symbol}
          </span>
          <button
            onClick={() => setFilterCat('')}
            className="text-xs text-primary-600 hover:text-primary-800 cursor-pointer"
          >
            Effacer le filtre
          </button>
        </div>
      )}

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-slate-500">
            {filterCat ? 'Aucune dépense dans cette catégorie' : 'Aucune dépense enregistrée'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Dépense
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase text-right">
                  Montant
                </th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => {
                const cat = EXPENSE_CATEGORIES[expense.category]
                return (
                  <tr
                    key={expense.id}
                    className="border-b border-slate-100 hover:bg-slate-50 group"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{expense.title}</p>
                      {expense.notes && (
                        <p className="text-xs text-slate-400">{expense.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {cat?.icon} {cat?.label ?? expense.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(expense.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                      {expense.amount.toLocaleString('fr-FR', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {symbol}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditExpense(expense)
                            setShowForm(true)
                          }}
                          className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(expense.id)}
                          className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ExpenseForm
          tripId={trip.id}
          currency={trip.currency}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          expense={editExpense}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false)
            setEditExpense(null)
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer la dépense"
          message="Voulez-vous vraiment supprimer cette dépense ?"
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function ExpenseForm({
  tripId,
  currency,
  tripStartDate,
  tripEndDate,
  expense,
  onSave,
  onCancel,
}: {
  tripId: string
  currency: string
  tripStartDate: string
  tripEndDate: string
  expense: Expense | null
  onSave: (e: Expense) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(expense?.title ?? '')
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'food')
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [dateWarning, setDateWarning] = useState('')

  function handleDateChange(newDate: string) {
    setDate(newDate)
    if (newDate < tripStartDate || newDate > tripEndDate) {
      setDateWarning('Cette date est en dehors des dates du voyage')
    } else {
      setDateWarning('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      id: expense?.id ?? uuidv4(),
      tripId,
      dayId: expense?.dayId ?? '',
      title,
      amount: parseFloat(amount) || 0,
      currency,
      category,
      date,
      notes,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dîner au restaurant"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.icon} {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                dateWarning ? 'border-amber-400' : 'border-slate-300'
              }`}
            />
            {dateWarning && (
              <p className="text-xs text-amber-600 mt-1">{dateWarning}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
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
              {expense ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
