import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const OPEN_STAGES = ['lead', 'qualified', 'proposal', 'negotiation']
const STAGE_LABELS = { lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' }
const ALL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

function money(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function CrmPipeline() {
  const { user, ready } = useAuthGuard()
  const [deals, setDeals] = useState([])
  const [summary, setSummary] = useState(null)
  const [clients, setClients] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  const [clientId, setClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [addingNewClient, setAddingNewClient] = useState(false)
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [movingId, setMovingId] = useState(null)

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [dealsRes, summaryRes, clientsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/summary`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, { headers: authHeaders() }),
      ])
      setDeals(dealsRes.ok ? (await dealsRes.json()).deals || [] : [])
      setSummary(summaryRes.ok ? await summaryRes.json() : null)
      const clientList = clientsRes.ok ? (await clientsRes.json()).clients || [] : []
      setClients(clientList)
      if (clientList.length > 0) {
        setClientId((prev) => prev || String(clientList[0].id))
      } else {
        setAddingNewClient(true)
      }
    } catch (err) {
      console.error('Failed to load CRM data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) {
      setError('Enter a deal title.')
      return
    }
    setCreating(true)
    try {
      let useClientId = clientId
      if (addingNewClient) {
        if (!newClientName.trim()) {
          setError('Enter a name for the new contact.')
          setCreating(false)
          return
        }
        const clientRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ name: newClientName }),
        })
        const clientData = await clientRes.json()
        if (!clientRes.ok) {
          setError(clientData.detail || 'Could not add contact.')
          setCreating(false)
          return
        }
        useClientId = clientData.id
      }
      if (!useClientId) {
        setError('Choose or add a contact for this deal.')
        setCreating(false)
        return
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ client_id: Number(useClientId), title, value: parseFloat(value) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not create deal.')
        return
      }
      setTitle('')
      setValue('')
      setNewClientName('')
      setAddingNewClient(false)
      await loadAll()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleMoveStage = async (dealId, newStage) => {
    setMovingId(dealId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/crm/deals/${dealId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ stage: newStage }),
      })
      if (res.ok) {
        await loadAll()
      }
    } catch (err) {
      console.error('Failed to move deal:', err)
    } finally {
      setMovingId(null)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage))
  const closedDeals = deals.filter((d) => !OPEN_STAGES.includes(d.stage))

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'CRM' }]} />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-gold mb-2">CRM & Sales Pipeline</h1>
        <p className="font-inter text-gray-600 mb-10">Track deals from first contact to close.</p>

        {summary && (
          <div className="bg-white border border-lightgray p-6 mb-10 flex flex-wrap gap-8">
            <div>
              <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Open Pipeline Value</p>
              <p className="font-garamond text-2xl text-navy">
                {money(Object.values(summary.pipeline_value_by_stage).reduce((a, b) => a + b, 0))}
              </p>
            </div>
            <div>
              <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Won Value</p>
              <p className="font-garamond text-2xl text-navy">{money(summary.won_value)}</p>
            </div>
            <div>
              <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Win Rate</p>
              <p className="font-garamond text-2xl text-navy">
                {summary.win_rate !== null ? `${summary.win_rate}%` : 'Not enough data'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-lightgray p-8 mb-12">
          <h2 className="font-garamond text-2xl text-navy mb-6">Add a Deal</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="font-inter text-sm font-medium text-navy block mb-2">Contact</label>
              {addingNewClient ? (
                <input
                  type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Contact name" className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              ) : (
                <select
                  value={clientId} onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              )}
              {clients.length > 0 && (
                <button type="button" onClick={() => setAddingNewClient((p) => !p)} className="font-inter text-xs text-gold underline mt-2">
                  {addingNewClient ? 'Choose an existing contact instead' : '+ Add a new contact'}
                </button>
              )}
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Deal Title</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Value ($)</label>
              <input
                type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div className="md:col-span-4">
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50">
                {creating ? 'Adding...' : '+ Add Deal'}
              </button>
            </div>
          </form>
          {error && <p className="font-inter text-sm text-error mt-4">{error}</p>}
        </div>

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading pipeline...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
              {OPEN_STAGES.map((stage) => (
                <div key={stage} className="bg-white border border-lightgray p-4">
                  <h3 className="font-garamond text-lg text-navy mb-4">{STAGE_LABELS[stage]}</h3>
                  <div className="space-y-3">
                    {openDeals.filter((d) => d.stage === stage).map((deal) => (
                      <div key={deal.id} className="border border-lightgray p-3">
                        <Link href={`/tools/crm/${deal.id}`}>
                          <p className="font-inter text-sm text-navy font-medium hover:text-gold cursor-pointer">{deal.title}</p>
                        </Link>
                        <p className="font-inter text-xs text-gray-500 mb-2">{deal.client_name} · {money(deal.value)}</p>
                        <select
                          value={deal.stage}
                          disabled={movingId === deal.id}
                          onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                          className="w-full text-xs px-2 py-1 border border-lightgray focus:outline-none focus:border-gold"
                        >
                          {ALL_STAGES.map((s) => (
                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {openDeals.filter((d) => d.stage === stage).length === 0 && (
                      <p className="font-inter text-xs text-gray-400">No deals</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <h2 className="font-garamond text-2xl text-navy mb-6">Closed Deals</h2>
            {closedDeals.length === 0 ? (
              <p className="font-inter text-gray-600">No closed deals yet.</p>
            ) : (
              <div className="space-y-3">
                {closedDeals.map((deal) => (
                  <Link key={deal.id} href={`/tools/crm/${deal.id}`}>
                    <div className="bg-white border border-lightgray p-4 flex items-center justify-between cursor-pointer hover:border-navy transition">
                      <div className="flex items-center gap-3">
                        <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${deal.stage === 'won' ? 'bg-gold bg-opacity-10 text-gold' : 'bg-error bg-opacity-10 text-error'}`}>
                          {STAGE_LABELS[deal.stage]}
                        </span>
                        <p className="font-inter text-navy">{deal.title} — {deal.client_name}</p>
                      </div>
                      <p className="font-garamond text-navy">{money(deal.value)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
