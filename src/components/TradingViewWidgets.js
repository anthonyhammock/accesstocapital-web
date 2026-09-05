import { useEffect, useRef } from 'react'

// TradingView's free public embed widgets — no API key, no account needed.
// They render as an injected iframe once their script tag runs, so each
// widget here manages its own container ref directly rather than going
// through React's normal child-rendering (React never sees what's inside).
//
// proName/symbol expects "EXCHANGE:SYMBOL" (e.g. "NASDAQ:AAPL"). We don't
// know which exchange a given watchlist ticker actually trades on, so this
// defaults to NASDAQ — the right guess for most common retail tickers, but
// a NYSE-listed symbol (e.g. "BA", "JPM") may not resolve. That's a cosmetic
// limit of the free widget, not a data problem on our side.
const toProSymbol = (symbol) => (symbol.includes(':') ? symbol : `NASDAQ:${symbol}`)

export function TickerTape({ symbols }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || symbols.length === 0) return
    containerRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embed-widget/ticker-tape.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: symbols.map((s) => ({ proName: toProSymbol(s), title: s })),
      showSymbolLogo: true,
      colorTheme: 'light',
      isTransparent: false,
      displayMode: 'adaptive',
      locale: 'en',
    })
    containerRef.current.appendChild(script)
  }, [symbols.join(',')])

  if (symbols.length === 0) return null
  return <div className="tradingview-widget-container" ref={containerRef} />
}

export function MiniChart({ symbol }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current || !symbol) return
    containerRef.current.innerHTML = '<div class="tradingview-widget-container__widget"></div>'

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embed-widget/mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: toProSymbol(symbol),
      width: '100%',
      height: 150,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'light',
      isTransparent: false,
      autosize: true,
    })
    containerRef.current.appendChild(script)
  }, [symbol])

  return <div className="tradingview-widget-container" ref={containerRef} />
}
