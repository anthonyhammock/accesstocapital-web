import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const STATUS_LABELS = { paid: 'Paid', overdue: 'Overdue', partial: 'Partial', unpaid: 'Unpaid' }
const STATUS_STYLES = {
  paid: 'bg-gold bg-opacity-10 text-gold',
  overdue: 'bg-error bg-opacity-10 text-error',
  partial: 'bg-gray-100 text-gray-600',
  unpaid: 'bg-gray-100 text-gray-600',
}
const PAYMENT_METHOD_LABELS = { check: 'Check', ach: 'ACH', card: 'Card', wire: 'Wire', cash: 'Cash', other: 'Other' }

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function VendorDetail() {
  const router = useRouter()
  const { vendorId } = router.query
  const { user, ready } = useAuthGuard()
  const [vendor, setVendor] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  const [billNumber, setBillNumber] = useState('')
  const [billDate, setBillDate] = useState(todayIso())
  const [dueDate, setDueDate] = useState(todayIso())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [addingBill, setAddingBill] = useState(false)

  const [payingBillId, setPayingBillId] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('ach')
  const [payReference, setPayReference] = useState('')
  const [payDate, setPayDate] = useState(todayIso())
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [payError, setPayError] = useState('')

  const [expandedBillId, setExpandedBillId] = useState(null)
  const [billPayments, setBillPayments] = useState({})
  const [voidError, setVoidError] = useState('')

  useEffect(() => {
    if (ready && vendorId) {
      loadVendor()
    }
  }, [ready, vendorId])

  const loadVendor = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/vendors/${vendorId}`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        setError('Vendor not found.')
        return
      }
      setVendor(await res.json())
    } catch (err) {
      console.error('Failed to load vendor:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddBill = async (e) => {
    e.preventDefault()
    setError('')
    setAddingBill(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          vendor_id: Number(vendorId),
          bill_number: billNumber || null,
          bill_date: billDate,
          due_date: dueDate,
          amount: parseFloat(amount),
          category: category || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not add bill.')
        return
      }
      setBillNumber('')
      setAmount('')
      setCategory('')
      await loadVendor()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setAddingBill(false)
    }
  }

  const openPaymentForm = (bill) => {
    setPayingBillId(bill.id)
    setPayAmount(bill.balance.toString())
    setPayError('')
  }

  const handleRecordPayment = async (billId) => {
    setPayError('')
    setSubmittingPayment(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/bills/${billId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          amount: parseFloat(payAmount),
          payment_date: payDate,
          payment_method: payMethod,
          reference_number: payReference || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setPayError(data.detail || 'Could not record payment.')
        return
      }
      setPayingBillId(null)
      setPayReference('')
      await loadVendor()
    } catch (err) {
      setPayError('Network error. Please try again.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleVoidPayment = async (paymentId, billId) => {
    setVoidError('')
    try {
      const deleteRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/payments/${paymentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (!deleteRes.ok) {
        setVoidError('Could not void that payment. Please try again.')
        return
      }
      await loadVendor()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/bills/${billId}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBillPayments((prev) => ({ ...prev, [billId]: data.payments || [] }))
      }
    } catch (err) {
      setVoidError('Network error. Please try again.')
      console.error('Failed to void payment:', err)
    }
  }

  const loadBillDetail = async (billId) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null)
      return
    }
    setExpandedBillId(billId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ap/bills/${billId}`, {
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setBillPayments((prev) => ({ ...prev, [billId]: data.payments || [] }))
      }
    } catch (err) {
      console.error('Failed to load bill payments:', err)
    }
  }

  if (!ready || loadingData) {
    return <div>Loading...</div>
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col">
        <AppHeader user={user} breadcrumbs={[{ label: 'Vendor & AP Management', href: '/tools/vendor-ap' }, { label: 'Not Found' }]} />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <p className="font-inter text-error">{error || 'Vendor not found.'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Vendor & AP Management', href: '/tools/vendor-ap' }, { label: vendor.name }]} />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-gold mb-2">{vendor.name}</h1>
            <p className="font-inter text-gray-600">
              {vendor.email && `${vendor.email} · `}
              {vendor.phone && `${vendor.phone} · `}
              {vendor.payment_terms.replace('_', ' ')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500">Outstanding Balance</p>
            <p className={`font-garamond text-3xl ${vendor.outstanding_balance > 0 ? 'text-error' : 'text-navy'}`}>
              {money(vendor.outstanding_balance)}
            </p>
          </div>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-12">
          <h2 className="font-garamond text-2xl text-navy mb-6">Add a Bill</h2>
          <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Bill # (optional)</label>
              <input
                type="text" value={billNumber} onChange={(e) => setBillNumber(e.target.value)}
                placeholder="INV-1042"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Bill Date</label>
              <input
                type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} required
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
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Amount</label>
              <input
                type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" required
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Category (optional)</label>
              <input
                type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="Supplies"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div className="md:col-span-5">
              <button type="submit" disabled={addingBill} className="btn-primary disabled:opacity-50">
                {addingBill ? 'Adding...' : '+ Add Bill'}
              </button>
            </div>
          </form>
          {error && <p className="font-inter text-sm text-error mt-4">{error}</p>}
        </div>

        <h2 className="font-garamond text-2xl text-navy mb-6">Bills</h2>

        {vendor.bills.length === 0 ? (
          <p className="font-inter text-gray-600">No bills yet — add one above.</p>
        ) : (
          <div className="space-y-4">
            {vendor.bills.map((bill) => (
              <div key={bill.id} className="bg-white border border-lightgray p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${STATUS_STYLES[bill.status]}`}>
                      {STATUS_LABELS[bill.status]}
                    </span>
                    <div>
                      <p className="font-garamond text-lg text-navy">
                        {bill.bill_number || `Bill #${bill.id}`} — {money(bill.amount)}
                        {bill.category && <span className="font-inter text-sm text-gray-500"> · {bill.category}</span>}
                      </p>
                      <p className="font-inter text-xs text-gray-500">
                        Due {new Date(bill.due_date).toLocaleDateString()}
                        {bill.amount_paid > 0 && ` · ${money(bill.amount_paid)} paid, ${money(bill.balance)} remaining`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {bill.status !== 'paid' && (
                      <button onClick={() => openPaymentForm(bill)} className="btn-secondary text-sm">
                        Record Payment
                      </button>
                    )}
                    <button onClick={() => loadBillDetail(bill.id)} className="font-inter text-sm text-gold underline">
                      {expandedBillId === bill.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {payingBillId === bill.id && (
                  <div className="mt-4 pt-4 border-t border-lightgray grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="font-inter text-sm font-medium text-navy block mb-2">Amount</label>
                      <input
                        type="number" step="0.01" min="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="font-inter text-sm font-medium text-navy block mb-2">Date</label>
                      <input
                        type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                        className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="font-inter text-sm font-medium text-navy block mb-2">Method</label>
                      <select
                        value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                        className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                      >
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-inter text-sm font-medium text-navy block mb-2">Reference (optional)</label>
                      <input
                        type="text" value={payReference} onChange={(e) => setPayReference(e.target.value)}
                        placeholder="Check #, confirmation #"
                        className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div className="md:col-span-4 flex items-center gap-3">
                      <button
                        onClick={() => handleRecordPayment(bill.id)} disabled={submittingPayment}
                        className="btn-primary disabled:opacity-50"
                      >
                        {submittingPayment ? 'Recording...' : 'Confirm Payment'}
                      </button>
                      <button onClick={() => setPayingBillId(null)} className="font-inter text-sm text-gray-500 underline">
                        Cancel
                      </button>
                    </div>
                    {payError && <p className="md:col-span-4 font-inter text-sm text-error">{payError}</p>}
                  </div>
                )}

                {expandedBillId === bill.id && billPayments[bill.id] && (
                  <div className="mt-4 pt-4 border-t border-lightgray">
                    {billPayments[bill.id].length === 0 ? (
                      <p className="font-inter text-sm text-gray-500">No payments recorded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {billPayments[bill.id].map((p) => (
                          <div key={p.id} className="flex items-center justify-between font-inter text-sm">
                            <span className="text-gray-600">
                              {new Date(p.payment_date).toLocaleDateString()} · {PAYMENT_METHOD_LABELS[p.payment_method]}
                              {p.reference_number && ` · ${p.reference_number}`}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-navy">{money(p.amount)}</span>
                              <button onClick={() => handleVoidPayment(p.id, bill.id)} className="text-error text-xs underline">
                                Void
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {voidError && <p className="font-inter text-sm text-error mt-2">{voidError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
