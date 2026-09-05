import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
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
const PAYMENT_METHOD_LABELS = { check: 'Check', ach: 'ACH', card: 'Card', wire: 'Wire', cash: 'Cash', other: 'Other' }

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function InvoiceDetail() {
  const router = useRouter()
  const { invoiceId } = router.query
  const { user, ready } = useAuthGuard()
  const [invoice, setInvoice] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)

  const [payingOpen, setPayingOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('ach')
  const [payReference, setPayReference] = useState('')
  const [payDate, setPayDate] = useState(todayIso())
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [payError, setPayError] = useState('')
  const [voidError, setVoidError] = useState('')

  useEffect(() => {
    if (ready && invoiceId) {
      loadInvoice()
    }
  }, [ready, invoiceId])

  const loadInvoice = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/invoices/${invoiceId}`, {
        headers: authHeaders(),
      })
      if (!res.ok) {
        setError('Invoice not found.')
        return
      }
      setInvoice(await res.json())
    } catch (err) {
      console.error('Failed to load invoice:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/invoices/${invoiceId}/send`, {
        method: 'POST', headers: authHeaders(),
      })
      if (res.ok) {
        await loadInvoice()
      }
    } catch (err) {
      console.error('Failed to send invoice:', err)
    } finally {
      setSending(false)
    }
  }

  const publicUrl = () => (invoice ? `${window.location.origin}/invoice/${invoice.public_token}` : '')

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const openPaymentForm = () => {
    setPayAmount(invoice.balance.toString())
    setPayingOpen(true)
    setPayError('')
  }

  const handleRecordPayment = async () => {
    setPayError('')
    setSubmittingPayment(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/invoices/${invoiceId}/payments`, {
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
      setPayingOpen(false)
      setPayReference('')
      await loadInvoice()
    } catch (err) {
      setPayError('Network error. Please try again.')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleVoidPayment = async (paymentId) => {
    setVoidError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/payments/${paymentId}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      if (!res.ok) {
        setVoidError('Could not void that payment. Please try again.')
        return
      }
      await loadInvoice()
    } catch (err) {
      setVoidError('Network error. Please try again.')
    }
  }

  if (!ready || loadingData) {
    return <div>Loading...</div>
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col">
        <AppHeader user={user} breadcrumbs={[{ label: 'Invoicing', href: '/tools/invoicing' }, { label: 'Not Found' }]} />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <p className="font-inter text-error">{error || 'Invoice not found.'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Invoicing', href: '/tools/invoicing' }, { label: invoice.invoice_number }]} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-garamond text-4xl font-medium text-gold">{invoice.invoice_number}</h1>
              <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${STATUS_STYLES[invoice.status]}`}>
                {STATUS_LABELS[invoice.status]}
              </span>
            </div>
            <p className="font-inter text-gray-600">
              {invoice.client_name}{invoice.client_email && ` · ${invoice.client_email}`}
            </p>
            <p className="font-inter text-sm text-gray-500 mt-1">
              Issued {new Date(invoice.issue_date).toLocaleDateString()} · Due {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500">Total</p>
            <p className="font-garamond text-3xl text-navy">{money(invoice.total)}</p>
            {invoice.status !== 'paid' && invoice.status !== 'draft' && (
              <p className={`font-inter text-sm ${invoice.status === 'overdue' ? 'text-error' : 'text-gray-500'}`}>
                {money(invoice.balance)} remaining
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border border-lightgray p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
          {invoice.is_sent ? (
            <>
              <p className="font-inter text-sm text-gray-600">Share this link so your client can view the invoice.</p>
              <div className="flex items-center gap-3">
                <button onClick={handleCopyLink} className="btn-secondary text-sm">
                  {copied ? 'Copied!' : 'Copy Invoice Link'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-inter text-sm text-gray-600">This invoice is still a draft — send it to make it visible to your client.</p>
              <button onClick={handleSend} disabled={sending} className="btn-primary text-sm disabled:opacity-50">
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white border border-lightgray p-8 mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lightgray text-left">
                <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">Description</th>
                <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3 text-right">Qty</th>
                <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3 text-right">Unit Price</th>
                <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map((li) => (
                <tr key={li.id} className="border-b border-lightgray">
                  <td className="font-inter text-navy py-3">{li.description}</td>
                  <td className="font-inter text-navy py-3 text-right">{li.quantity}</td>
                  <td className="font-inter text-navy py-3 text-right">{money(li.unit_price)}</td>
                  <td className="font-inter text-navy py-3 text-right">{money(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col items-end mt-4 gap-1">
            <p className="font-inter text-sm text-gray-600">Subtotal: {money(invoice.subtotal)}</p>
            {invoice.tax_rate > 0 && (
              <p className="font-inter text-sm text-gray-600">Tax ({invoice.tax_rate}%): {money(invoice.total - invoice.subtotal)}</p>
            )}
            <p className="font-garamond text-xl text-navy">Total: {money(invoice.total)}</p>
          </div>
          {invoice.notes && (
            <p className="font-inter text-sm text-gray-600 mt-6 pt-6 border-t border-lightgray">{invoice.notes}</p>
          )}
        </div>

        <div className="bg-white border border-lightgray p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-garamond text-2xl text-navy">Payments</h2>
            {invoice.status !== 'paid' && invoice.status !== 'draft' && !payingOpen && (
              <button onClick={openPaymentForm} className="btn-secondary text-sm">Record Payment</button>
            )}
          </div>

          {payingOpen && (
            <div className="mb-6 pb-6 border-b border-lightgray grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>
              <div className="md:col-span-4 flex items-center gap-3">
                <button onClick={handleRecordPayment} disabled={submittingPayment} className="btn-primary disabled:opacity-50">
                  {submittingPayment ? 'Recording...' : 'Confirm Payment'}
                </button>
                <button onClick={() => setPayingOpen(false)} className="font-inter text-sm text-gray-500 underline">Cancel</button>
              </div>
              {payError && <p className="md:col-span-4 font-inter text-sm text-error">{payError}</p>}
            </div>
          )}

          {invoice.payments.length === 0 ? (
            <p className="font-inter text-sm text-gray-500">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between font-inter text-sm">
                  <span className="text-gray-600">
                    {new Date(p.payment_date).toLocaleDateString()} · {PAYMENT_METHOD_LABELS[p.payment_method]}
                    {p.reference_number && ` · ${p.reference_number}`}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-navy">{money(p.amount)}</span>
                    <button onClick={() => handleVoidPayment(p.id)} className="text-error text-xs underline">Void</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {voidError && <p className="font-inter text-sm text-error mt-2">{voidError}</p>}
        </div>
      </main>
    </div>
  )
}
