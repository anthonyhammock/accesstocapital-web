import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

function money(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// FastAPI's own 4xx errors send {detail: "a string"}, but a 422 validation
// failure sends {detail: [{loc, msg, type}, ...]} — rendering that array
// directly as JSX throws "Objects are not valid as a React child" and
// unmounts the page, so always reduce it to a plain string first.
function errorMessage(data, fallback) {
  if (!data || !data.detail) return fallback
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.map((e) => e.msg || fallback).join(' ')
  return fallback
}

export default function BalanceSheet() {
  const { user, ready } = useAuthGuard()
  const [report, setReport] = useState(null)
  const [items, setItems] = useState([])
  const [equityEntries, setEquityEntries] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [itemSide, setItemSide] = useState('asset')
  const [itemName, setItemName] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [itemError, setItemError] = useState('')
  const [savingItem, setSavingItem] = useState(false)

  const [entryType, setEntryType] = useState('contribution')
  const [entryAmount, setEntryAmount] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [entryDescription, setEntryDescription] = useState('')
  const [entryError, setEntryError] = useState('')
  const [savingEntry, setSavingEntry] = useState(false)

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [reportRes, itemsRes, entriesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/balance-sheet`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/items`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/equity-entries`, { headers: authHeaders() }),
      ])
      setReport(reportRes.ok ? await reportRes.json() : null)
      setItems(itemsRes.ok ? (await itemsRes.json()).items || [] : [])
      setEquityEntries(entriesRes.ok ? (await entriesRes.json()).entries || [] : [])
    } catch (err) {
      console.error('Failed to load balance sheet:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setItemError('')
    if (!itemName.trim()) {
      setItemError('Enter a name for this item.')
      return
    }
    setSavingItem(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ side: itemSide, name: itemName, amount: parseFloat(itemAmount) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setItemError(errorMessage(data, 'Could not add item.'))
        return
      }
      setItemName('')
      setItemAmount('')
      await loadAll()
    } catch (err) {
      setItemError('Network error. Please try again.')
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/items/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (res.ok) await loadAll()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const handleAddEntry = async (e) => {
    e.preventDefault()
    setEntryError('')
    if (!entryDate) {
      setEntryError('Choose a date.')
      return
    }
    setSavingEntry(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/equity-entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          entry_type: entryType, amount: parseFloat(entryAmount) || 0,
          entry_date: entryDate, description: entryDescription || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEntryError(errorMessage(data, 'Could not add entry.'))
        return
      }
      setEntryAmount('')
      setEntryDate('')
      setEntryDescription('')
      await loadAll()
    } catch (err) {
      setEntryError('Network error. Please try again.')
    } finally {
      setSavingEntry(false)
    }
  }

  const handleDeleteEntry = async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/balance-sheet/equity-entries/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (res.ok) await loadAll()
    } catch (err) {
      console.error('Failed to delete entry:', err)
    }
  }

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/balance-sheet/export`, { headers: authHeaders() })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `balance-sheet-${report?.as_of || 'export'}.csv`
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
      <AppHeader user={user} breadcrumbs={[{ label: 'Money & Bookkeeping', href: '/tools/bookkeeping' }, { label: 'Balance Sheet' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Balance Sheet</h1>
            <p className="font-inter text-gray-600 max-w-2xl">
              Cash, Accounts Receivable, and Accounts Payable are pulled automatically from your
              Bookkeeping, Invoicing, and Vendor & AP data — nothing to re-enter. Add anything else
              (equipment, loans, owner contributions) below.
            </p>
          </div>
          <Link href="/tools/bookkeeping" className="font-inter text-sm text-gold hover:underline mt-2">
            ← Back to Bookkeeping
          </Link>
        </div>

        {loadingData || !report ? (
          <p className="font-inter text-gray-600 mt-8">Loading statement...</p>
        ) : (
          <>
            <div className="flex justify-end my-6">
              <button onClick={handleDownloadCsv} className="btn-secondary">Download CSV</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="bg-white border border-lightgray p-8">
                <h2 className="font-garamond text-2xl text-navy mb-6">Assets</h2>
                <div className="space-y-3 font-inter text-navy">
                  <div className="flex justify-between"><span>Cash</span><span>{money(report.assets.cash)}</span></div>
                  <div className="flex justify-between"><span>Accounts Receivable</span><span>{money(report.assets.accounts_receivable)}</span></div>
                  <div className="flex justify-between"><span>Other Assets</span><span>{money(report.assets.other_assets)}</span></div>
                </div>
                <div className="flex justify-between font-semibold text-navy border-t border-lightgray mt-4 pt-4">
                  <span>Total Assets</span><span>{money(report.assets.total)}</span>
                </div>
              </div>

              <div className="bg-white border border-lightgray p-8">
                <h2 className="font-garamond text-2xl text-navy mb-6">Liabilities</h2>
                <div className="space-y-3 font-inter text-navy">
                  <div className="flex justify-between"><span>Accounts Payable</span><span>{money(report.liabilities.accounts_payable)}</span></div>
                  <div className="flex justify-between"><span>Other Liabilities</span><span>{money(report.liabilities.other_liabilities)}</span></div>
                </div>
                <div className="flex justify-between font-semibold text-navy border-t border-lightgray mt-4 pt-4">
                  <span>Total Liabilities</span><span>{money(report.liabilities.total)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gold p-8 mb-12">
              <h2 className="font-garamond text-2xl text-navy mb-6">Owner's Equity</h2>
              <div className="space-y-3 font-inter text-navy mb-4">
                <div className="flex justify-between">
                  <span>Cash-Basis Equity (Retained Earnings + Contributions − Draws)</span>
                  <span>{money(report.equity.cash_basis_equity)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Net Assets (A/R + Other Assets − A/P − Other Liabilities)</span>
                  <span>{money(report.equity.other_net_assets)}</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-navy border-t border-lightgray pt-4 mb-6">
                <span>Total Owner's Equity</span><span>{money(report.equity.total)}</span>
              </div>
              <div className="flex justify-between font-garamond text-2xl text-gold border-t border-gold pt-4">
                <span>Total Liabilities & Equity</span><span>{money(report.total_liabilities_and_equity)}</span>
              </div>
              <p className="font-inter text-xs text-gray-500 mt-4">As of {report.as_of} — Total Assets always equals Total Liabilities & Equity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-lightgray p-8">
                <h2 className="font-garamond text-2xl text-navy mb-4">Other Assets & Liabilities</h2>
                <p className="font-inter text-sm text-gray-600 mb-6">Things the platform has no automatic feed for yet — equipment, inventory, a loan balance.</p>
                <form onSubmit={handleAddItem} className="space-y-3 mb-6">
                  <div className="flex gap-3">
                    <select value={itemSide} onChange={(e) => setItemSide(e.target.value)} className="w-1/3">
                      <option value="asset">Asset</option>
                      <option value="liability">Liability</option>
                    </select>
                    <input type="text" placeholder="Name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="flex-1 px-3 py-2 border border-lightgray focus:outline-none focus:border-gold" />
                  </div>
                  <div className="flex gap-3">
                    <input type="number" step="0.01" min="0" placeholder="Amount" value={itemAmount} onChange={(e) => setItemAmount(e.target.value)} className="flex-1 px-3 py-2 border border-lightgray focus:outline-none focus:border-gold" />
                    <button type="submit" disabled={savingItem} className="btn-secondary disabled:opacity-50">{savingItem ? 'Adding...' : '+ Add'}</button>
                  </div>
                  {itemError && <p className="font-inter text-xs text-error">{itemError}</p>}
                </form>
                {items.length === 0 ? (
                  <p className="font-inter text-sm text-gray-500">No other items yet.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm font-inter border-t border-lightgray pt-2">
                        <span className="text-navy">{item.name} <span className="text-xs text-gray-500 uppercase">({item.side})</span></span>
                        <div className="flex items-center gap-3">
                          <span className="text-navy">{money(item.amount)}</span>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-error text-xs hover:underline">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-lightgray p-8">
                <h2 className="font-garamond text-2xl text-navy mb-4">Owner Contributions & Draws</h2>
                <p className="font-inter text-sm text-gray-600 mb-6">Money you've put into the business or taken out of it.</p>
                <form onSubmit={handleAddEntry} className="space-y-3 mb-6">
                  <div className="flex gap-3">
                    <select value={entryType} onChange={(e) => setEntryType(e.target.value)} className="w-1/3">
                      <option value="contribution">Contribution</option>
                      <option value="draw">Draw</option>
                    </select>
                    <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="flex-1 px-3 py-2 border border-lightgray focus:outline-none focus:border-gold" />
                  </div>
                  <input type="number" step="0.01" min="0" placeholder="Amount" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} className="w-full px-3 py-2 border border-lightgray focus:outline-none focus:border-gold" />
                  <div className="flex gap-3">
                    <input type="text" placeholder="Description (optional)" value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} className="flex-1 px-3 py-2 border border-lightgray focus:outline-none focus:border-gold" />
                    <button type="submit" disabled={savingEntry} className="btn-secondary disabled:opacity-50">{savingEntry ? 'Adding...' : '+ Add'}</button>
                  </div>
                  {entryError && <p className="font-inter text-xs text-error">{entryError}</p>}
                </form>
                {equityEntries.length === 0 ? (
                  <p className="font-inter text-sm text-gray-500">No contributions or draws recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {equityEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm font-inter border-t border-lightgray pt-2">
                        <span className="text-navy">
                          {new Date(entry.entry_date).toLocaleDateString()} — {entry.entry_type === 'contribution' ? 'Contribution' : 'Draw'}
                          {entry.description && ` (${entry.description})`}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={entry.entry_type === 'draw' ? 'text-error' : 'text-navy'}>{entry.entry_type === 'draw' ? '−' : ''}{money(entry.amount)}</span>
                          <button onClick={() => handleDeleteEntry(entry.id)} className="text-error text-xs hover:underline">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
