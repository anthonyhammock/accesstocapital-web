import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

export default function ProfitAndLoss() {
  const { user, ready } = useAuthGuard()
  const [year, setYear] = useState(currentYear)
  const [report, setReport] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (ready) {
      loadReport()
    }
  }, [ready, year])

  const loadReport = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/profit-and-loss?year=${year}`,
        { headers: authHeaders() }
      )
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error('Failed to load P&L report:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/profit-and-loss/export?year=${year}`,
        { headers: authHeaders() }
      )
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `profit-and-loss-${year}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download CSV:', err)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Money & Bookkeeping', href: '/tools/bookkeeping' }, { label: 'Profit & Loss' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Profit &amp; Loss</h1>
            <p className="font-inter text-gray-600">
              Built automatically from your Bookkeeping ledger — no separate data entry.
            </p>
          </div>
          <div className="flex gap-6 mt-2">
            <Link href="/tools/cash-flow" className="font-inter text-sm text-gold hover:underline">
              View Cash Flow Statement →
            </Link>
            <Link href="/tools/bookkeeping" className="font-inter text-sm text-gold hover:underline">
              ← Back to Bookkeeping
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 my-8">
          <label className="font-inter text-sm font-medium text-navy">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-auto"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleDownloadCsv} className="btn-secondary ml-auto">
            Download CSV
          </button>
        </div>

        {loadingData || !report ? (
          <p className="font-inter text-gray-600">Loading statement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Revenue</p>
                <p className="font-garamond text-3xl text-navy font-medium">${fmt(report.revenue.total)}</p>
              </div>
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Total Expenses</p>
                <p className="font-garamond text-3xl text-navy font-medium">${fmt(report.expenses.total)}</p>
              </div>
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Net Income</p>
                <p className={`font-garamond text-3xl font-medium ${report.net_income >= 0 ? 'text-navy' : 'text-error'}`}>
                  ${fmt(report.net_income)}
                </p>
              </div>
            </div>

            <div className="bg-white border border-lightgray p-8">
              <h2 className="font-garamond text-2xl font-medium text-navy mb-6">Expenses by Category</h2>
              {report.expenses.by_category.length === 0 ? (
                <p className="font-inter text-gray-600">No expenses recorded for {year}.</p>
              ) : (
                <div className="space-y-4">
                  {report.expenses.by_category.map((row) => (
                    <div key={row.label} className="border-l-4 border-gold pl-6 py-2 flex justify-between items-center">
                      <p className="font-inter text-navy">{row.label}</p>
                      <p className="font-inter font-bold text-navy">${fmt(row.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
