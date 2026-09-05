import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const STATUS_LABELS = { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', partial: 'Partial' }
const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-gray-100 text-gray-600',
  paid: 'bg-gold bg-opacity-10 text-gold',
  overdue: 'bg-error bg-opacity-10 text-error',
  partial: 'bg-gray-100 text-gray-600',
}
const AGING_BUCKET_LABELS = {
  current: 'Current',
  '1-30': '1-30 days',
  '31-60': '31-60 days',
  '61-90': '61-90 days',
  '90+': '90+ days',
}

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function inDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function InvoicingDashboard() {
  const { user, ready } = useAuthGuard()
  const [invoices, setInvoices] = useState([])
  const [summary, setSummary] = useState(null)
  const [clients, setClients] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [clientId, setClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [addingNewClient, setAddingNewClient] = useState(false)
  const [issueDate, setIssueDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(inDaysIso(30))
  const [taxRate, setTaxRate] = useState('0')
  const [lineItems, setLineItems] = useState([{ description: '', quantity: '1', unit_price: '' }])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [invoicesRes, summaryRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/invoices`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/summary`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, { headers: authHeaders() }),
      ])
      setInvoices(invoicesRes.ok ? (await invoicesRes.json()).invoices || [] : [])
      setSummary(summaryRes.ok ? await summaryRes.json() : null)
      const clientList = clientsRes.ok ? (await clientsRes.json()).clients || [] : []
      setClients(clientList)
      if (clientList.length > 0) {
        setClientId((prev) => prev || String(clientList[0].id))
      } else {
        setAddingNewClient(true)
      }
    } catch (err) {
      console.error('Failed to load invoicing data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)))
  }

  const addLineItemRow = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: '1', unit_price: '' }])
  }

  const removeLineItemRow = (index) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const lineItemsSubtotal = lineItems.reduce(
    (sum, li) => sum + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0),
    0
  )
  const estimatedTotal = lineItemsSubtotal * (1 + (parseFloat(taxRate) || 0) / 100)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      let useClientId = clientId

      if (addingNewClient) {
        if (!newClientName.trim()) {
          setError('Enter a name for the new client.')
          setCreating(false)
          return
        }
        const clientRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ name: newClientName, email: newClientEmail || null }),
        })
        const clientData = await clientRes.json()
        if (!clientRes.ok) {
          setError(clientData.detail || 'Could not add client.')
          setCreating(false)
          return
        }
        useClientId = clientData.id
      }

      if (!useClientId) {
        setError('Choose or add a client to invoice.')
        setCreating(false)
        return
      }

      const validItems = lineItems.filter((li) => li.description.trim() && parseFloat(li.unit_price) >= 0)
      if (validItems.length === 0) {
        setError('Add at least one line item with a description and price.')
        setCreating(false)
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          client_id: Number(useClientId),
          issue_date: issueDate,
          due_date: dueDate,
          tax_rate: parseFloat(taxRate) || 0,
          line_items: validItems.map((li) => ({
            description: li.description,
            quantity: parseFloat(li.quantity) || 1,
            unit_price: parseFloat(li.unit_price) || 0,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not create invoice.')
        return
      }
      setLineItems([{ description: '', quantity: '1', unit_price: '' }])
      setTaxRate('0')
      setNewClientName('')
      setNewClientEmail('')
      setAddingNewClient(false)
      await loadAll()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Invoicing' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Invoicing</h1>
        <p className="font-inter text-gray-600 mb-10">
          Create professional invoices, send a shareable link, and track payments as they come in.
        </p>

        {summary && summary.invoice_counts.sent + summary.invoice_counts.partial + summary.invoice_counts.overdue > 0 && (
          <div className="bg-white border border-lightgray p-6 mb-10">
            <h2 className="font-garamond text-lg text-navy mb-4">Aging Summary</h2>
            <div className="flex flex-wrap gap-6 mb-6">
              <div>
                <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Total Outstanding</p>
                <p className="font-garamond text-2xl text-navy">{money(summary.total_outstanding)}</p>
              </div>
              <div>
                <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Total Overdue</p>
                <p className={`font-garamond text-2xl ${summary.total_overdue > 0 ? 'text-error' : 'text-navy'}`}>
                  {money(summary.total_overdue)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {summary.aging_buckets.map((bucket) => (
                <div key={bucket.label} className="border border-lightgray p-3 text-center">
                  <p className="font-inter text-xs text-gray-500 mb-1">{AGING_BUCKET_LABELS[bucket.label] || bucket.label}</p>
                  <p className="font-garamond text-lg text-navy">{money(bucket.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-lightgray p-8 mb-12">
          <h2 className="font-garamond text-2xl text-navy mb-6">Create an Invoice</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="font-inter text-sm font-medium text-navy block mb-2">Client</label>
                {addingNewClient ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Client name" className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                    />
                    <input
                      type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Email (optional)" className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                    />
                  </div>
                ) : (
                  <select
                    value={clientId} onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
                {clients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddingNewClient((prev) => !prev)}
                    className="font-inter text-xs text-gold underline mt-2"
                  >
                    {addingNewClient ? 'Choose an existing client instead' : '+ Add a new client'}
                  </button>
                )}
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Issue Date</label>
                <input
                  type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Due Date</label>
                <input
                  type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <label className="font-inter text-sm font-medium text-navy block mb-2">Line Items</label>
            <div className="space-y-2 mb-4">
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text" value={li.description} onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    placeholder="Description" className="col-span-6 px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                  <input
                    type="number" step="0.01" min="0.01" value={li.quantity} onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                    placeholder="Qty" className="col-span-2 px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                  <input
                    type="number" step="0.01" min="0" value={li.unit_price} onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
                    placeholder="Unit Price" className="col-span-3 px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                  <button
                    type="button" onClick={() => removeLineItemRow(i)}
                    className="col-span-1 font-inter text-error text-lg"
                    aria-label="Remove line item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLineItemRow} className="font-inter text-sm text-gold underline mb-6">
              + Add another line item
            </button>

            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Tax Rate (%)</label>
                <input
                  type="number" step="0.01" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
                  className="w-32 px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>
              <div className="font-inter text-sm text-gray-600">
                Subtotal: <strong className="text-navy">{money(lineItemsSubtotal)}</strong>
                {' · '}
                Estimated Total: <strong className="text-navy">{money(estimatedTotal)}</strong>
              </div>
            </div>

            <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50">
              {creating ? 'Creating...' : '+ Create Invoice'}
            </button>
          </form>
          {error && <p className="font-inter text-sm text-error mt-4">{error}</p>}
        </div>

        <h2 className="font-garamond text-2xl text-navy mb-6">Invoices</h2>

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="font-inter text-gray-600">No invoices yet — create one above.</p>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Link key={invoice.id} href={`/tools/invoicing/${invoice.id}`}>
                <div className="bg-white border border-lightgray p-6 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:border-navy transition">
                  <div className="flex items-center gap-3">
                    <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${STATUS_STYLES[invoice.status]}`}>
                      {STATUS_LABELS[invoice.status]}
                    </span>
                    <div>
                      <p className="font-garamond text-lg text-navy">
                        {invoice.invoice_number} — {invoice.client_name}
                      </p>
                      <p className="font-inter text-xs text-gray-500">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-garamond text-lg text-navy">{money(invoice.total)}</p>
                    {invoice.amount_paid > 0 && invoice.status !== 'paid' && (
                      <p className="font-inter text-xs text-gray-500">{money(invoice.balance)} remaining</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
