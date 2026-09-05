import { useState, useEffect } from 'react'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

export default function TradingSignalsHistory() {
  const { user, ready } = useAuthGuard()
  const [signals, setSignals] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (ready) {
      loadHistory()
    }
  }, [ready, days])

  const loadHistory = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/signals/history?days=${days}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      setSignals(data.signals || [])
    } catch (err) {
      console.error('Failed to load signal history:', err)
    } finally {
      setLoadingData(false)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Trading Signals', href: '/tools/trading-signals' }, { label: 'History' }]} />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Signal History</h1>
            <p className="font-inter text-gray-600">Past signals for the symbols on your watchlist.</p>
          </div>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="px-4 py-2 border border-lightgray">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loadingData ? (
          <p className="font-inter text-gray-600">Loading...</p>
        ) : signals.length === 0 ? (
          <p className="font-inter text-gray-600">No signals in this window.</p>
        ) : (
          <div className="space-y-4">
            {signals.map((s) => (
              <div key={s.id} className="bg-white border border-lightgray p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${s.signal_type === 'buy' ? 'bg-gold bg-opacity-10 text-gold' : 'bg-error bg-opacity-10 text-error'}`}>
                      {s.signal_type}
                    </span>
                    <h3 className="font-garamond text-lg text-navy">{s.symbol}</h3>
                    <span className="font-inter text-xs text-gray-500">{s.confidence}% · {s.timeframe} · {s.market_condition}</span>
                  </div>
                  <span className="font-inter text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <p className="font-inter text-sm text-gray-600">{s.reason}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
