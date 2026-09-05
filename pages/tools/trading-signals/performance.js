import { useState, useEffect } from 'react'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const StatCard = ({ label, value, positive }) => (
  <div className="card">
    <p className="font-inter text-sm text-gray-600 mb-2">{label}</p>
    <p className={`font-garamond text-2xl font-medium ${positive === true ? 'text-navy' : positive === false ? 'text-error' : 'text-navy'}`}>
      {value}
    </p>
  </div>
)

export default function TradingSignalsPerformance() {
  const { user, ready } = useAuthGuard()
  const [performance, setPerformance] = useState(null)
  const [trades, setTrades] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [closingTradeId, setClosingTradeId] = useState(null)
  const [exitPrice, setExitPrice] = useState('')
  const [closeError, setCloseError] = useState('')

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [perfRes, tradesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/performance`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/trades`, { headers: authHeaders() }),
      ])
      setPerformance(await perfRes.json())
      setTrades((await tradesRes.json()).trades || [])
    } catch (err) {
      console.error('Failed to load performance data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const startClosing = (trade) => {
    setClosingTradeId(trade.id)
    setExitPrice('')
    setCloseError('')
  }

  const handleCloseTrade = async (tradeId) => {
    setCloseError('')
    if (!exitPrice || parseFloat(exitPrice) <= 0) {
      setCloseError('Enter the price you exited at.')
      return
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/trades/${tradeId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ exit_price: parseFloat(exitPrice), exit_at: new Date().toISOString() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCloseError(data.detail || 'Could not close this trade.')
        return
      }
      setClosingTradeId(null)
      await loadAll()
    } catch (err) {
      setCloseError('Network error. Please try again.')
    }
  }

  const fmt = (n) => (n === null || n === undefined ? '—' : `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)

  if (!ready || loadingData || !performance) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Trading Signals', href: '/tools/trading-signals' }, { label: 'Performance' }]} />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Performance</h1>
        <p className="font-inter text-gray-600 mb-10">
          Based on trades you've logged yourself — nothing here is executed automatically.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Win Rate" value={performance.win_rate !== null ? `${performance.win_rate}%` : '—'} />
          <StatCard label="Total P&L" value={fmt(performance.total_pnl)} positive={performance.total_pnl >= 0} />
          <StatCard label="Avg ROI" value={performance.avg_roi_pct !== null ? `${performance.avg_roi_pct.toFixed(2)}%` : '—'} />
          <StatCard label="Closed Trades" value={performance.closed_trades} />
          <StatCard label="Avg Win" value={fmt(performance.avg_win)} positive={true} />
          <StatCard label="Avg Loss" value={fmt(performance.avg_loss)} positive={false} />
          <StatCard label="Best Trade" value={fmt(performance.best_trade)} positive={performance.best_trade >= 0} />
          <StatCard label="Worst Trade" value={fmt(performance.worst_trade)} positive={performance.worst_trade >= 0} />
        </div>

        <h2 className="font-garamond text-xl text-navy mb-4">Your Trades</h2>
        {trades.length === 0 ? (
          <p className="font-inter text-gray-600">No trades logged yet — log one from an active signal to start tracking performance.</p>
        ) : (
          <div className="space-y-4">
            {trades.map((t) => (
              <div key={t.id} className="bg-white border border-lightgray p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-garamond text-lg text-navy">{t.symbol}</h3>
                    <span className="font-inter text-xs uppercase text-gray-500">{t.side}</span>
                    <span className={`font-inter text-xs uppercase px-2 py-1 ${t.status === 'open' ? 'bg-gold bg-opacity-10 text-gold' : 'bg-gray-100 text-gray-600'}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.status === 'closed' && (
                    <span className={`font-inter text-sm font-medium ${t.pnl >= 0 ? 'text-navy' : 'text-error'}`}>
                      {fmt(t.pnl)} ({t.roi_pct}%)
                    </span>
                  )}
                </div>
                <p className="font-inter text-sm text-gray-600 mb-3">
                  {t.shares} shares @ ${t.entry_price} on {new Date(t.entry_at).toLocaleDateString()}
                  {t.status === 'closed' && ` → exited @ $${t.exit_price} on ${new Date(t.exit_at).toLocaleDateString()}`}
                </p>

                {t.status === 'open' && (
                  closingTradeId === t.id ? (
                    <div className="flex flex-wrap items-end gap-3 border-t border-lightgray pt-4">
                      <div>
                        <label className="font-inter text-xs text-gray-500 block mb-1">Exit price</label>
                        <input
                          type="number" step="0.01" value={exitPrice}
                          onChange={(e) => setExitPrice(e.target.value)}
                          className="px-3 py-2 border border-lightgray w-32"
                        />
                      </div>
                      <button onClick={() => handleCloseTrade(t.id)} className="btn-primary text-sm">Confirm</button>
                      <button onClick={() => setClosingTradeId(null)} className="font-inter text-sm text-gray-500 hover:underline">Cancel</button>
                      {closeError && <p className="font-inter text-xs text-error w-full">{closeError}</p>}
                    </div>
                  ) : (
                    <button onClick={() => startClosing(t)} className="btn-secondary text-sm">Close Trade</button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
