import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

export default function ClientPortalList() {
  const { user, ready } = useAuthGuard()
  const [clients, setClients] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (ready) {
      loadClients()
    }
  }, [ready])

  const loadClients = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      setClients(data.clients || [])
    } catch (err) {
      console.error('Failed to load clients:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setCreating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ name, email: email || null, notes: notes || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not add client.')
        return
      }
      setName('')
      setEmail('')
      setNotes('')
      await loadClients()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const portalUrl = (token) => `${window.location.origin}/portal/${token}`

  const handleCopy = async (client) => {
    try {
      await navigator.clipboard.writeText(portalUrl(client.portal_token))
      setCopiedId(client.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Client Portal' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Client Portal</h1>
        <p className="font-inter text-gray-600 mb-10">
          Share documents with clients through a private link — no account required on their end.
        </p>

        <div className="bg-white border border-lightgray p-8 mb-12">
          <h2 className="font-garamond text-2xl text-navy mb-6">Add a Client</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Client"
                required
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What this client is for"
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div className="md:col-span-3">
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50">
                {creating ? 'Adding...' : '+ Add Client'}
              </button>
            </div>
          </form>
          {error && <p className="font-inter text-sm text-error mt-4">{error}</p>}
        </div>

        <h2 className="font-garamond text-2xl text-navy mb-6">Your Clients</h2>

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading clients...</p>
        ) : clients.length === 0 ? (
          <p className="font-inter text-gray-600">No clients yet — add one above to get started.</p>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="bg-white border border-lightgray p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-garamond text-xl text-navy">{client.name}</h3>
                    {!client.is_active && (
                      <span className="font-inter text-xs uppercase tracking-wide px-2 py-1 bg-gray-100 text-gray-600">
                        Link Revoked
                      </span>
                    )}
                  </div>
                  {client.email && <p className="font-inter text-sm text-gray-600">{client.email}</p>}
                  <p className="font-inter text-xs text-gray-500 mt-1">
                    {client.document_count} document{client.document_count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleCopy(client)} className="btn-secondary text-sm">
                    {copiedId === client.id ? 'Copied!' : 'Copy Portal Link'}
                  </button>
                  <Link href={`/tools/client-portal/${client.id}`}>
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
