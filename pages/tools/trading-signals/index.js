import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'
import { TickerTape, MiniChart } from '../../../src/components/TradingViewWidgets'

const TIMEFRAMES = ['5min', '15min', '1h', '1day']
const STRATEGIES = ['hybrid', 'momentum', 'mean_reversion', 'breakout']
const STRATEGY_DESCRIPTIONS = {
  hybrid: 'A blend of trend-following and reversal signals — the default, good for most watchlists.',
  momentum: 'Trend-following: betting an existing move (up or down) continues.',
  mean_reversion: 'Betting a price that’s moved too far, too fast bounces back toward its average.',
  breakout: 'Betting a price breaks out of its recent trading range, usually on a volume spike.',
}

function InfoTooltip({ children }) {
  return (
    <span className="relative inline-block group align-middle ml-1">
      <span
        tabIndex={0}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-[10px] font-inter cursor-help focus:outline-none"
      >
        i
      </span>
      <span className="hidden group-hover:block group-focus-within:block absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-navy text-offwhite text-xs font-inter rounded p-3 shadow-lg">
        {children}
      </span>
    </span>
  )
}

function tierForConfidence(successRate, confidence) {
  if (!successRate?.by_confidence_tier) return null
  return successRate.by_confidence_tier.find((t) => {
    const [lo, hi] = t.confidence_range.replace('%', '').split('-').map(Number)
    return confidence >= lo && confidence <= hi
  })
}

export default function TradingSignalsDashboard() {
  const { user, ready } = useAuthGuard()
  const [status, setStatus] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [signals, setSignals] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [successRate, setSuccessRate] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  const [symbol, setSymbol] = useState('')
  const [timeframe, setTimeframe] = useState('1h')
  const [strategyType, setStrategyType] = useState('hybrid')
  const [watchlistError, setWatchlistError] = useState('')
  const [addingSymbol, setAddingSymbol] = useState(false)

  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  const [loggingSignalId, setLoggingSignalId] = useState(null)
  const [tradeShares, setTradeShares] = useState('')
  const [tradeSide, setTradeSide] = useState('long')
  const [tradeError, setTradeError] = useState('')
  const [submittingTrade, setSubmittingTrade] = useState(false)

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [statusRes, watchlistRes, signalsRes, prefsRes, successRateRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/status`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/watchlist`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/signals`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/preferences`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/success-rate`, { headers: authHeaders() }),
      ])
      setStatus(await statusRes.json())
      setWatchlist((await watchlistRes.json()).entries || [])
      setSignals((await signalsRes.json()).signals || [])
      setPreferences(await prefsRes.json())
      setSuccessRate(successRateRes.ok ? await successRateRes.json() : null)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/signals/mark-viewed`, {
        method: 'POST', headers: authHeaders(),
      })
    } catch (err) {
      console.error('Failed to load trading data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddSymbol = async (e) => {
    e.preventDefault()
    setWatchlistError('')
    setAddingSymbol(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ symbol, timeframe, strategy_type: strategyType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setWatchlistError(data.detail || 'Could not add symbol.')
        return
      }
      setSymbol('')
      await loadAll()
    } catch (err) {
      setWatchlistError('Network error. Please try again.')
    } finally {
      setAddingSymbol(false)
    }
  }

  const handleRemoveSymbol = async (id) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/watchlist/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      })
      await loadAll()
    } catch (err) {
      console.error('Failed to remove symbol:', err)
    }
  }

  const updatePref = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    setPrefsSaved(false)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(preferences),
      })
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setSavingPrefs(false)
    }
  }

  const startLoggingTrade = (signal) => {
    setLoggingSignalId(signal.id)
    setTradeSide(signal.signal_type === 'sell' ? 'short' : 'long')
    setTradeShares('')
    setTradeError('')
  }

  const handleLogTrade = async (signal) => {
    setTradeError('')
    if (submittingTrade) return
    if (!tradeShares || parseFloat(tradeShares) <= 0) {
      setTradeError('Enter how many shares you executed.')
      return
    }
    setSubmittingTrade(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/trading/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          symbol: signal.symbol,
          side: tradeSide,
          shares: parseFloat(tradeShares),
          entry_price: signal.entry_price,
          entry_at: new Date().toISOString(),
          signal_id: signal.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTradeError(data.detail || 'Could not log this trade.')
        return
      }
      setLoggingSignalId(null)
    } catch (err) {
      setTradeError('Network error. Please try again.')
    } finally {
      setSubmittingTrade(false)
    }
  }

  if (!ready || loadingData || !status || !preferences) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Trading Signals' }]} />

      {watchlist.length > 0 && (
        <div className="border-b border-lightgray bg-white">
          <TickerTape symbols={watchlist.map((w) => w.symbol)} />
        </div>
      )}

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Trading Signals</h1>
        <p className="font-inter text-gray-600 mb-4">
          Technical-analysis signals for your watchlist, delivered as alerts. You always execute
          manually on your own broker.
        </p>
        <div className="bg-offwhite border border-gold p-4 mb-10">
          <p className="font-inter text-xs text-gray-600">
            <strong className="text-navy">Educational/informational only — not investment advice.</strong>{' '}
            AI-generated signals are not a guarantee of future results, and past performance does not
            indicate future performance. Trading involves risk of loss; you are solely responsible for
            any trades you choose to execute.
          </p>
        </div>

        {!status.market_data_configured && (
          <div className="bg-white border border-lightgray p-6 mb-10">
            <p className="font-inter text-sm text-navy">
              <strong>Beta:</strong> live market data isn't connected yet, so no signals will be
              generated until that's set up. Your watchlist and alert settings are saved and ready.
            </p>
          </div>
        )}

        {successRate?.overall?.sample_size > 0 && (
          <div className="bg-white border border-lightgray p-6 mb-10">
            <h2 className="font-garamond text-lg text-navy mb-3">Historical Track Record</h2>
            <p className="font-inter text-sm text-gray-600 mb-4">
              Of {successRate.overall.sample_size} past signals that have since resolved (hit either
              their target or their stop loss), <strong className="text-navy">{successRate.overall.hit_rate}%</strong> hit
              their target first.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {successRate.by_confidence_tier.map((tier) => (
                <div key={tier.confidence_range} className="border border-lightgray p-3 text-center">
                  <p className="font-inter text-xs text-gray-500 mb-1">{tier.confidence_range} confidence</p>
                  <p className="font-garamond text-xl text-navy">
                    {tier.hit_rate !== null ? `${tier.hit_rate}%` : 'Not enough data'}
                  </p>
                  <p className="font-inter text-xs text-gray-400">n={tier.sample_size}</p>
                </div>
              ))}
            </div>
            <p className="font-inter text-xs text-gray-500 mt-4">{successRate.disclaimer}</p>
          </div>
        )}

        <div className="flex gap-6 mb-10">
          <Link href="/tools/trading-signals/history" className="font-inter text-sm text-gold hover:underline">
            View Signal History →
          </Link>
          <Link href="/tools/trading-signals/performance" className="font-inter text-sm text-gold hover:underline">
            View Performance →
          </Link>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-6">Your Watchlist</h2>
          <form onSubmit={handleAddSymbol} className="flex flex-wrap items-end gap-4 mb-6">
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                required
                className="px-4 py-3 border border-lightgray focus:outline-none focus:border-gold w-32"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Timeframe</label>
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="px-4 py-3 border border-lightgray">
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy mb-2 flex items-center">
                Strategy
                <InfoTooltip>
                  <p className="font-medium mb-2">What each style of trading strategy means:</p>
                  <ul className="space-y-1">
                    {STRATEGIES.map((s) => (
                      <li key={s}><strong className="capitalize">{s.replace('_', ' ')}:</strong> {STRATEGY_DESCRIPTIONS[s]}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-gray-300">
                    This tags the entry for your own reference — every strategy currently uses the
                    same signal scoring underneath.
                  </p>
                </InfoTooltip>
              </label>
              <select value={strategyType} onChange={(e) => setStrategyType(e.target.value)} className="px-4 py-3 border border-lightgray">
                {STRATEGIES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <button type="submit" disabled={addingSymbol} className="btn-primary disabled:opacity-50">
              {addingSymbol ? 'Adding...' : '+ Add to Watchlist'}
            </button>
          </form>
          {watchlistError && <p className="font-inter text-sm text-error mb-4">{watchlistError}</p>}

          {watchlist.length === 0 ? (
            <p className="font-inter text-gray-600">No symbols yet — add one above to start receiving signals.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {watchlist.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 border border-lightgray px-4 py-2">
                  <span className="font-inter text-sm text-navy font-medium">{entry.symbol}</span>
                  <span className="font-inter text-xs text-gray-500">{entry.timeframe} · {entry.strategy_type.replace('_', ' ')}</span>
                  <button onClick={() => handleRemoveSymbol(entry.id)} className="font-inter text-xs text-error hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <h2 className="font-garamond text-xl text-navy mb-4">Active Signals</h2>
        {signals.length === 0 ? (
          <p className="font-inter text-gray-600 mb-10">No active signals right now.</p>
        ) : (
          <div className="space-y-4 mb-10">
            {signals.map((s) => {
              const tier = tierForConfidence(successRate, s.confidence)
              return (
              <div key={s.id} className="bg-white border border-lightgray p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`font-inter text-xs uppercase tracking-wide px-3 py-1 ${s.signal_type === 'buy' ? 'bg-gold bg-opacity-10 text-gold' : 'bg-error bg-opacity-10 text-error'}`}>
                      {s.signal_type}
                    </span>
                    <h3 className="font-garamond text-xl text-navy">{s.symbol}</h3>
                    <span className="font-inter text-xs text-gray-500">{s.confidence}% confidence</span>
                  </div>
                  <span className="font-inter text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-3 font-inter text-sm">
                  <div><span className="text-gray-500">Entry:</span> <span className="text-navy font-medium">${s.entry_price}</span></div>
                  <div><span className="text-gray-500">Target:</span> <span className="text-navy font-medium">${s.target_price}</span></div>
                  <div><span className="text-gray-500">Stop Loss:</span> <span className="text-navy font-medium">${s.stop_loss}</span></div>
                </div>
                <div className="mb-4">
                  <MiniChart symbol={s.symbol} />
                </div>

                {s.explanation && s.explanation.length > 0 && (
                  <div className="bg-offwhite border-l-4 border-gold p-4 mb-3">
                    <p className="font-inter text-xs uppercase tracking-wide text-gold mb-2">Why this signal?</p>
                    <ul className="font-inter text-sm text-navy space-y-1 list-disc list-inside">
                      {s.explanation.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  </div>
                )}
                <p className="font-inter text-xs text-gray-500 mb-3">{s.reason}</p>

                {tier && (
                  <p className="font-inter text-xs text-gray-500 mb-4">
                    {tier.hit_rate !== null
                      ? `Signals in this ${tier.confidence_range} confidence range have historically hit their target ${tier.hit_rate}% of the time (based on ${tier.sample_size} past signals).`
                      : `Not enough historical data yet for signals in this ${tier.confidence_range} confidence range.`}
                  </p>
                )}

                {loggingSignalId === s.id ? (
                  <div className="flex flex-wrap items-end gap-3 border-t border-lightgray pt-4">
                    <div>
                      <label className="font-inter text-xs text-gray-500 block mb-1">Shares executed</label>
                      <input
                        type="number" step="0.01" value={tradeShares}
                        onChange={(e) => setTradeShares(e.target.value)}
                        className="px-3 py-2 border border-lightgray w-28"
                      />
                    </div>
                    <button onClick={() => handleLogTrade(s)} disabled={submittingTrade} className="btn-primary text-sm disabled:opacity-50">
                      {submittingTrade ? 'Logging...' : 'Confirm'}
                    </button>
                    <button onClick={() => setLoggingSignalId(null)} disabled={submittingTrade} className="font-inter text-sm text-gray-500 hover:underline disabled:opacity-50">Cancel</button>
                    {tradeError && <p className="font-inter text-xs text-error w-full">{tradeError}</p>}
                  </div>
                ) : (
                  <button onClick={() => startLoggingTrade(s)} className="btn-secondary text-sm">
                    Log This Trade
                  </button>
                )}
              </div>
              )
            })}
          </div>
        )}

        <div className="bg-white border border-lightgray p-8">
          <h2 className="font-garamond text-xl text-navy mb-6">Alert Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <label className="flex items-center gap-2 font-inter text-sm text-navy">
              <input type="checkbox" checked={preferences.email_enabled} onChange={(e) => updatePref('email_enabled', e.target.checked)} />
              Email alerts {!status.email_configured && <span className="text-xs text-gray-400">(not yet configured)</span>}
            </label>
            <div>
              <label className="flex items-center gap-2 font-inter text-sm text-navy mb-2">
                <input type="checkbox" checked={preferences.sms_enabled} onChange={(e) => updatePref('sms_enabled', e.target.checked)} />
                SMS alerts {!status.sms_configured && <span className="text-xs text-gray-400">(not yet configured)</span>}
              </label>
              {preferences.sms_enabled && (
                <input
                  type="tel" value={preferences.sms_phone || ''} onChange={(e) => updatePref('sms_phone', e.target.value)}
                  placeholder="+15551234567" className="px-4 py-2 border border-lightgray w-full"
                />
              )}
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Minimum confidence to alert (%)</label>
              <input
                type="number" min="0" max="100" value={preferences.min_confidence}
                onChange={(e) => updatePref('min_confidence', parseInt(e.target.value))}
                className="px-4 py-2 border border-lightgray w-full"
              />
            </div>
            <label className="flex items-center gap-2 font-inter text-sm text-navy">
              <input type="checkbox" checked={preferences.digest_mode} onChange={(e) => updatePref('digest_mode', e.target.checked)} />
              Digest mode (no real-time alerts)
            </label>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Quiet hours start (UTC)</label>
              <input
                type="time" value={preferences.quiet_hours_start || ''} onChange={(e) => updatePref('quiet_hours_start', e.target.value || null)}
                className="px-4 py-2 border border-lightgray w-full"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Quiet hours end (UTC)</label>
              <input
                type="time" value={preferences.quiet_hours_end || ''} onChange={(e) => updatePref('quiet_hours_end', e.target.value || null)}
                className="px-4 py-2 border border-lightgray w-full"
              />
            </div>
          </div>
          <button onClick={handleSavePreferences} disabled={savingPrefs} className="btn-primary disabled:opacity-50">
            {savingPrefs ? 'Saving...' : prefsSaved ? 'Saved!' : 'Save Alert Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}
