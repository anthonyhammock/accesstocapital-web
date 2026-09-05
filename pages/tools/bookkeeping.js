import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

const emptyForm = {
  transaction_date: new Date().toISOString().slice(0, 10),
  merchant_name: '',
  amount: '',
  transaction_type: 'expense',
  cash_flow_category: 'operating',
  description: ''
}

const CASH_FLOW_LABELS = {
  operating: 'Operating',
  investing: 'Investing',
  financing: 'Financing'
}

export default function Bookkeeping() {
  const { user, ready } = useAuthGuard()
  const [year, setYear] = useState(currentYear)
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ready) {
      loadData()
    }
  }, [ready, year])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [txRes, summaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/transactions?year=${year}`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/summary?year=${year}`, { headers: authHeaders() })
      ])
      const txData = await txRes.json()
      const summaryData = await summaryRes.json()
      setTransactions(txData.transactions || [])
      setSummary(summaryData)
    } catch (err) {
      console.error('Failed to load bookkeeping data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const startEdit = (tx) => {
    setEditingId(tx.id)
    setForm({
      transaction_date: tx.date,
      merchant_name: tx.merchant,
      amount: String(tx.amount),
      transaction_type: tx.transaction_type,
      cash_flow_category: tx.cash_flow_category,
      description: tx.description || ''
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const isEdit = editingId !== null
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/transactions/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/transactions`

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          transaction_date: form.transaction_date,
          merchant_name: form.merchant_name,
          amount: form.amount,
          transaction_type: form.transaction_type,
          cash_flow_category: form.cash_flow_category,
          description: form.description || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Could not save transaction.')
        setSaving(false)
        return
      }

      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
      loadData()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) {
      return
    }
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/transactions/${id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      loadData()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookkeeping/export?year=${year}`, {
        headers: authHeaders()
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookkeeping-${year}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download CSV:', err)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Money & Bookkeeping' }, { label: 'Bookkeeping' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Bookkeeping</h1>
            <p className="font-inter text-gray-600">
              Every transaction here is saved to your account automatically — nothing to export
              unless you want a copy.
            </p>
          </div>
          <Link href="/dashboard" className="font-inter text-sm text-gold hover:underline mt-2">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-4 my-8">
          <label className="font-inter text-sm font-medium text-navy">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-auto"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex gap-6 ml-auto">
            <Link href="/tools/profit-and-loss" className="font-inter text-sm text-gold hover:underline">
              View Profit &amp; Loss Statement →
            </Link>
            <Link href="/tools/cash-flow" className="font-inter text-sm text-gold hover:underline">
              View Cash Flow Statement →
            </Link>
          </div>
        </div>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card">
              <p className="font-inter text-sm text-gray-600 mb-2">Income</p>
              <p className="font-garamond text-3xl text-navy font-medium">
                ${summary.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card">
              <p className="font-inter text-sm text-gray-600 mb-2">Expenses</p>
              <p className="font-garamond text-3xl text-navy font-medium">
                ${summary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="card">
              <p className="font-inter text-sm text-gray-600 mb-2">Net</p>
              <p className={`font-garamond text-3xl font-medium ${summary.net >= 0 ? 'text-navy' : 'text-error'}`}>
                ${summary.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="font-garamond text-2xl font-medium text-navy">Transactions</h2>
          <div className="flex gap-4">
            <button onClick={handleDownloadCsv} className="btn-secondary">
              Download CSV
            </button>
            <button onClick={showForm && editingId === null ? () => setShowForm(false) : startAdd} className="btn-primary">
              {showForm && editingId === null ? 'Cancel' : '+ Add Transaction'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-lightgray p-8 mb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Date</label>
                <input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Type</label>
                <select
                  value={form.transaction_type}
                  onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}
                  className="w-full"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Merchant / Source</label>
                <input
                  type="text"
                  value={form.merchant_name}
                  onChange={(e) => setForm({ ...form, merchant_name: e.target.value })}
                  placeholder="Office Depot"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Cash Flow Activity</label>
                <select
                  value={form.cash_flow_category}
                  onChange={(e) => setForm({ ...form, cash_flow_category: e.target.value })}
                  className="w-full"
                >
                  <option value="operating">Operating (day-to-day income/expenses)</option>
                  <option value="investing">Investing (equipment, property, other assets)</option>
                  <option value="financing">Financing (loans, owner draws, investment)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Notes about this transaction"
                className="w-full"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : editingId !== null ? 'Save Changes' : 'Add Transaction'}
            </button>
          </form>
        )}

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="font-inter text-gray-600">No transactions for {year} yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Date</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Merchant / Source</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Type</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Activity</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Amount</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy">Description</th>
                  <th className="px-6 py-3 font-inter font-semibold text-navy"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-offwhite">
                    <td className="px-6 py-4 font-inter text-gray-700">{tx.date}</td>
                    <td className="px-6 py-4 font-inter text-navy font-medium">{tx.merchant}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 text-xs font-medium ${tx.transaction_type === 'income' ? 'bg-success bg-opacity-10 text-success' : 'bg-gold bg-opacity-10 text-gold'}`}>
                        {tx.transaction_type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-inter text-gray-600">{CASH_FLOW_LABELS[tx.cash_flow_category] || 'Operating'}</td>
                    <td className="px-6 py-4 font-inter font-medium text-navy">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-inter text-gray-600">{tx.description || '—'}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button onClick={() => startEdit(tx)} className="font-inter text-sm text-gold hover:underline mr-4">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="font-inter text-sm text-error hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
