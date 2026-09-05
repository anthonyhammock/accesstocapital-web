import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { AvatarLogo } from '../../src/components/LogoComponent'

const STATUS_LABELS = { sent: 'Unpaid', paid: 'Paid', overdue: 'Overdue', partial: 'Partially Paid' }
const STATUS_STYLES = {
  sent: 'bg-gray-100 text-gray-600',
  paid: 'bg-gold bg-opacity-10 text-gold',
  overdue: 'bg-error bg-opacity-10 text-error',
  partial: 'bg-gray-100 text-gray-600',
}

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function PublicInvoiceView() {
  const router = useRouter()
  const { token } = router.query
  const [invoice, setInvoice] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoicing/public/${token}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data) setInvoice(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <div className="min-h-screen bg-offwhite flex items-center justify-center font-inter text-gray-600">Loading...</div>
  }

  if (notFound || !invoice) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col items-center justify-center px-6">
        <AvatarLogo size="md" className="mb-6" />
        <h1 className="font-garamond text-2xl text-gold mb-3">Invoice Not Found</h1>
        <p className="font-inter text-gray-600 text-center">This link may be invalid or the invoice may have been removed.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite py-16 px-6 print:bg-white print:py-0">
      <div className="max-w-3xl mx-auto bg-white border border-lightgray p-10 print:border-0">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <AvatarLogo size="sm" className="mb-4" />
            <p className="font-inter text-sm text-gray-500">From {invoice.from_name || 'BlissPoint Access'}</p>
          </div>
          <div className="text-right">
            <h1 className="font-garamond text-3xl text-navy mb-2">{invoice.invoice_number}</h1>
            <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${STATUS_STYLES[invoice.status] || STATUS_STYLES.sent}`}>
              {STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          <div>
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Billed To</p>
            <p className="font-inter text-navy">{invoice.client_name}</p>
            {invoice.client_email && <p className="font-inter text-sm text-gray-500">{invoice.client_email}</p>}
          </div>
          <div className="text-right">
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Dates</p>
            <p className="font-inter text-navy">Issued {new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p className="font-inter text-navy">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
        </div>

        <table className="w-full mb-8">
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

        <div className="flex flex-col items-end gap-1 mb-10">
          <p className="font-inter text-sm text-gray-600">Subtotal: {money(invoice.subtotal)}</p>
          {invoice.tax_rate > 0 && (
            <p className="font-inter text-sm text-gray-600">Tax ({invoice.tax_rate}%): {money(invoice.total - invoice.subtotal)}</p>
          )}
          {invoice.amount_paid > 0 && (
            <p className="font-inter text-sm text-gray-600">Paid: {money(invoice.amount_paid)}</p>
          )}
          <p className="font-garamond text-2xl text-navy">
            {invoice.status === 'paid' ? 'Total Paid: ' : 'Balance Due: '}
            {money(invoice.status === 'paid' ? invoice.total : invoice.balance)}
          </p>
        </div>

        {invoice.notes && (
          <p className="font-inter text-sm text-gray-600 pt-6 border-t border-lightgray">{invoice.notes}</p>
        )}

        <div className="text-center mt-10 print:hidden">
          <button onClick={() => window.print()} className="btn-secondary text-sm">Print / Save as PDF</button>
        </div>
      </div>
    </div>
  )
}
