import { useState, useEffect } from 'react'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

const TOOL_LABELS = {
  consumer_accounts: 'Consumer Accounts',
  business_accounts: 'Business Accounts',
  portal_clients: 'Portal Clients',
  portal_documents: 'Portal Documents',
  scheduling_pages: 'Scheduling Pages',
  bookings: 'Bookings',
  calendar_connections: 'Calendar Connections',
  trading_watchlist_entries: 'Watchlist Entries',
  trading_signals_generated: 'Signals Generated',
  vendors: 'Vendors',
  bills: 'Bills',
  invoices: 'Invoices',
}

const INTEGRATION_LABELS = {
  finnhub_market_data: 'Finnhub (Market Data)',
  sendgrid_email: 'SendGrid (Email)',
  twilio_sms: 'Twilio (SMS)',
  google_calendar_oauth: 'Google Calendar OAuth',
  microsoft_calendar_oauth: 'Microsoft Calendar OAuth',
  trading_cron_secret: 'Trading Signals Cron Secret',
  calendar_token_encryption: 'Calendar Token Encryption Key',
}

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? 'bg-gold' : 'bg-gray-300'}`}
      aria-hidden="true"
    />
  )
}

export default function AdminDashboard() {
  const { user, ready } = useAuthGuard()
  const [forbidden, setForbidden] = useState(false)
  const [kpis, setKpis] = useState(null)
  const [status, setStatus] = useState(null)
  const [users, setUsers] = useState([])
  const [userTotal, setUserTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25
  const [search, setSearch] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [compingId, setCompingId] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    setLoadError('')
    try {
      const [kpisRes, statusRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/kpis`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/system-status`, { headers: authHeaders() }),
      ])
      if (kpisRes.status === 403 || statusRes.status === 403) {
        setForbidden(true)
        return
      }
      if (!kpisRes.ok || !statusRes.ok) {
        setLoadError('Could not load admin data. Please try again.')
        return
      }
      setKpis(await kpisRes.json())
      setStatus(await statusRes.json())
      await loadUsers(1, '')
    } catch (err) {
      setLoadError('Network error loading admin data. Please try again.')
      console.error('Failed to load admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const loadUsers = async (targetPage, searchTerm) => {
    setLoadingUsers(true)
    setLoadError('')
    try {
      const params = new URLSearchParams({ page: targetPage, page_size: PAGE_SIZE })
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`, { headers: authHeaders() })
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (!res.ok) {
        setLoadError('Could not load the user directory. Please try again.')
        return
      }
      const data = await res.json()
      setUsers(data.users || [])
      setUserTotal(data.total || 0)
      setPage(data.page || 1)
    } catch (err) {
      setLoadError('Network error loading the user directory. Please try again.')
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadUsers(1, search)
  }

  const totalPages = Math.max(1, Math.ceil(userTotal / PAGE_SIZE))

  const toggleComp = async (targetUser) => {
    setCompingId(targetUser.id)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${targetUser.id}/comp?comped=${!targetUser.is_comped}`,
        { method: 'POST', headers: authHeaders() }
      )
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, is_comped: !u.is_comped } : u)))
      }
    } catch (err) {
      console.error('Failed to toggle comped status:', err)
    } finally {
      setCompingId(null)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-offwhite flex flex-col">
        <AppHeader user={user} breadcrumbs={[{ label: 'Admin' }]} />
        <main className="flex-1 max-w-3xl mx-auto px-6 py-20 w-full text-center">
          <h1 className="font-garamond text-3xl text-gold mb-3">Admin Access Required</h1>
          <p className="font-inter text-gray-600">Your account doesn't have admin access.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Admin' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Admin Portal</h1>
        <p className="font-inter text-gray-600 mb-10">Platform KPIs, system status, and account management.</p>

        {loadError && (
          <p className="font-inter text-sm text-error bg-error bg-opacity-10 px-4 py-3 mb-6">{loadError}</p>
        )}

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading...</p>
        ) : (
          <>
            {kpis && (
              <div className="bg-white border border-lightgray p-6 mb-8">
                <h2 className="font-garamond text-lg text-navy mb-4">KPIs</h2>
                <div className="flex flex-wrap gap-6 mb-6">
                  <div>
                    <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Total Users</p>
                    <p className="font-garamond text-2xl text-navy">{kpis.total_users}</p>
                  </div>
                  <div>
                    <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">Comped Users</p>
                    <p className="font-garamond text-2xl text-navy">{kpis.comped_users}</p>
                  </div>
                  {Object.entries(kpis.users_by_account_type || {}).map(([type, count]) => (
                    <div key={type}>
                      <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-1">{type || 'Unset'}</p>
                      <p className="font-garamond text-2xl text-navy">{count}</p>
                    </div>
                  ))}
                </div>

                <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-3">Tool Usage</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {Object.entries(kpis.tool_usage_counts || {}).map(([key, count]) => (
                    <div key={key} className="border border-lightgray p-3 text-center">
                      <p className="font-inter text-xs text-gray-500 mb-1">{TOOL_LABELS[key] || key}</p>
                      <p className="font-garamond text-lg text-navy">{count}</p>
                    </div>
                  ))}
                </div>

                {kpis.signups_last_30_days.length > 0 && (
                  <>
                    <p className="font-inter text-xs uppercase tracking-wide text-gray-500 mb-3">Signups (Last 30 Days)</p>
                    <div className="flex items-end gap-1 h-24">
                      {kpis.signups_last_30_days.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${day.date}: ${day.count}`}>
                          <div
                            className="w-full bg-gold"
                            style={{ height: `${Math.max(8, day.count * 12)}px` }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {status && (
              <div className="bg-white border border-lightgray p-6 mb-8">
                <h2 className="font-garamond text-lg text-navy mb-4">System Status</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(status.integrations).map(([key, ok]) => (
                    <div key={key} className="font-inter text-sm text-navy flex items-center">
                      <StatusDot ok={ok} />
                      {INTEGRATION_LABELS[key] || key}
                      <span className="text-gray-400 ml-auto">{ok ? 'Configured' : 'Not configured'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-lightgray p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-garamond text-lg text-navy">User Directory</h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email"
                    className="px-4 py-2 border border-lightgray focus:outline-none focus:border-gold text-sm"
                  />
                  <button type="submit" className="btn-secondary text-sm">Search</button>
                </form>
              </div>

              {loadingUsers ? (
                <p className="font-inter text-sm text-gray-500">Loading...</p>
              ) : users.length === 0 ? (
                <p className="font-inter text-sm text-gray-500">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-lightgray text-left">
                        <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">User</th>
                        <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">Type</th>
                        <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">Joined</th>
                        <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">Admin</th>
                        <th className="font-inter text-xs uppercase tracking-wide text-gray-500 pb-3">Comped</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-lightgray">
                          <td className="font-inter text-navy py-3">
                            {u.first_name} {u.last_name}
                            <span className="text-gray-500 text-xs block">{u.email}</span>
                          </td>
                          <td className="font-inter text-navy py-3">{u.account_type}</td>
                          <td className="font-inter text-navy py-3 text-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="font-inter py-3">{u.is_admin ? <span className="text-gold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                          <td className="font-inter py-3">
                            <button
                              onClick={() => toggleComp(u)}
                              disabled={compingId === u.id}
                              className={`text-xs underline disabled:opacity-50 ${u.is_comped ? 'text-gold' : 'text-gray-400'}`}
                            >
                              {u.is_comped ? 'Comped — remove' : 'Grant free access'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-inter text-xs text-gray-500">
                      {userTotal} user{userTotal === 1 ? '' : 's'} · page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadUsers(page - 1, search)}
                        disabled={page <= 1 || loadingUsers}
                        className="btn-secondary text-xs disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => loadUsers(page + 1, search)}
                        disabled={page >= totalPages || loadingUsers}
                        className="btn-secondary text-xs disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
