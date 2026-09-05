import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const STAGE_LABELS = { lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' }
const ALL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const STAGE_STYLES = {
  lead: 'bg-gray-100 text-gray-600', qualified: 'bg-gray-100 text-gray-600',
  proposal: 'bg-gray-100 text-gray-600', negotiation: 'bg-gray-100 text-gray-600',
  won: 'bg-gold bg-opacity-10 text-gold', lost: 'bg-error bg-opacity-10 text-error',
}

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DealDetail() {
  const router = useRouter()
  const { dealId } = router.query
  const { user, ready } = useAuthGuard()
  const [deal, setDeal] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [movingStage, setMovingStage] = useState(false)
  const [noteBody, setNoteBody] = useState('')
  const [submittingNote, setSubmittingNote] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState('')

  useEffect(() => {
    if (ready && dealId) {
      loadDeal()
    }
  }, [ready, dealId])

  const loadDeal = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${dealId}`, { headers: authHeaders() })
      if (!res.ok) {
        setError('Deal not found.')
        return
      }
      setDeal(await res.json())
    } catch (err) {
      console.error('Failed to load deal:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleStageChange = async (newStage) => {
    setMovingStage(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${dealId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ stage: newStage }),
      })
      if (res.ok) {
        await loadDeal()
      }
    } catch (err) {
      console.error('Failed to move stage:', err)
    } finally {
      setMovingStage(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteBody.trim()) return
    setSubmittingNote(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${dealId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ body: noteBody }),
      })
      if (res.ok) {
        setNoteBody('')
        await loadDeal()
      }
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setSubmittingNote(false)
    }
  }

  const handleConvert = async () => {
    setConverting(true)
    setConvertError('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${dealId}/convert-to-invoice`, {
        method: 'POST', headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        setConvertError(data.detail || 'Could not convert this deal to an invoice.')
        return
      }
      await loadDeal()
    } catch (err) {
      setConvertError('Network error. Please try again.')
    } finally {
      setConverting(false)
    }
  }

  if (!ready || loadingData) {
    return <div>Loading...</div>
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col">
        <AppHeader user={user} breadcrumbs={[{ label: 'CRM', href: '/tools/crm' }, { label: 'Not Found' }]} />
        <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
          <p className="font-inter text-error">{error || 'Deal not found.'}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'CRM', href: '/tools/crm' }, { label: deal.title }]} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-garamond text-4xl font-medium text-gold">{deal.title}</h1>
              <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${STAGE_STYLES[deal.stage]}`}>
                {STAGE_LABELS[deal.stage]}
              </span>
            </div>
            <p className="font-inter text-gray-600">
              {deal.client_name}{deal.client_email && ` · ${deal.client_email}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-inter text-xs uppercase tracking-wide text-gray-500">Value</p>
            <p className="font-garamond text-3xl text-navy">{money(deal.value)}</p>
          </div>
        </div>

        <div className="bg-white border border-lightgray p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <label className="font-inter text-sm font-medium text-navy block mb-2">Stage</label>
            <select
              value={deal.stage} disabled={movingStage}
              onChange={(e) => handleStageChange(e.target.value)}
              className="px-4 py-2 border border-lightgray focus:outline-none focus:border-gold"
            >
              {ALL_STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {deal.stage === 'won' && (
            deal.invoice_id ? (
              <Link href={`/tools/invoicing/${deal.invoice_id}`}>
                <button className="btn-secondary text-sm">View Generated Invoice →</button>
              </Link>
            ) : (
              <div className="text-right">
                <button onClick={handleConvert} disabled={converting} className="btn-primary text-sm disabled:opacity-50">
                  {converting ? 'Converting...' : 'Convert to Invoice'}
                </button>
                {convertError && <p className="font-inter text-xs text-error mt-2">{convertError}</p>}
              </div>
            )
          )}
        </div>

        <div className="bg-white border border-lightgray p-8">
          <h2 className="font-garamond text-2xl text-navy mb-6">Activity</h2>
          <form onSubmit={handleAddNote} className="mb-6">
            <textarea
              value={noteBody} onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Log a call, email, or note about this deal..."
              rows={3}
              className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold mb-2"
            />
            <button type="submit" disabled={submittingNote} className="btn-secondary text-sm disabled:opacity-50">
              {submittingNote ? 'Adding...' : 'Add Note'}
            </button>
          </form>

          {deal.activity.length === 0 ? (
            <p className="font-inter text-sm text-gray-500">No activity logged yet.</p>
          ) : (
            <div className="space-y-4">
              {deal.activity.map((note) => (
                <div key={note.id} className="border-t border-lightgray pt-4">
                  <p className="font-inter text-navy">{note.body}</p>
                  <p className="font-inter text-xs text-gray-500 mt-1">{new Date(note.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
