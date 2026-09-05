import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const PAYMENT_TERMS_LABELS = {
  due_on_receipt: 'Due on Receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
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

export default function VendorApDashboard() {
  const { user, ready } = useAuthGuard()
  const [vendors, setVendors] = useState([])
  const [summary, setSummary] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('net_30')
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
      const [vendorsRes, summaryRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/vendors`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/summary`, { headers: authHeaders() }),
      ])
      setVendors(vendorsRes.ok ? (await vendorsRes.json()).vendors || [] : [])
      setSummary(summaryRes.ok ? await summaryRes.json() : null)
    } catch (err) {
      console.error('Failed to load vendor/AP data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, email: email || null, phone: phone || null, payment_terms: paymentTerms }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not add vendor.')
        return
      }
      setName('')
      setEmail('')
      setPhone('')
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
      <AppHeader user={user} breadcrumbs={[{ label: 'Vendor & AP Management' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Vendor & AP Management</h1>
        <p className="font-inter text-gray-600 mb-10">
          Track vendors, bills you owe, and payments — with an aging report so nothing slips past due.
        </p>

        {summary && summary.bill_counts.unpaid + summary.bill_counts.partial + summary.bill_counts.overdue > 0 && (
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
          <h2 className="font-garamond text-2xl text-navy mb-6">Add a Vendor</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Acme Supplies" required
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Email (optional)</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="ap@acme.com"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Phone (optional)</label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Payment Terms</label>
              <select
                value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              >
                {Object.entries(PAYMENT_TERMS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50">
                {creating ? 'Adding...' : '+ Add Vendor'}
              </button>
            </div>
          </form>
          {error && <p className="font-inter text-sm text-error mt-4">{error}</p>}
        </div>

        <h2 className="font-garamond text-2xl text-navy mb-6">Vendors</h2>

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading vendors...</p>
        ) : vendors.length === 0 ? (
          <p className="font-inter text-gray-600">No vendors yet — add one above to get started.</p>
        ) : (
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="bg-white border border-lightgray p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-garamond text-xl text-navy">{vendor.name}</h3>
                  <p className="font-inter text-sm text-gray-600">
                    {PAYMENT_TERMS_LABELS[vendor.payment_terms]}
                    {vendor.email && ` · ${vendor.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-inter text-xs uppercase tracking-wide text-gray-500">Outstanding</p>
                    <p className={`font-garamond text-lg ${vendor.outstanding_balance > 0 ? 'text-error' : 'text-navy'}`}>
                      {money(vendor.outstanding_balance)}
                    </p>
                  </div>
                  <Link href={`/tools/vendor-ap/${vendor.id}`}>
                    <button className="btn-primary text-sm">Open</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
