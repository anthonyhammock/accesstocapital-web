import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

export default function CashFlow() {
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/cash-flow?year=${year}`,
        { headers: authHeaders() }
      )
      const data = await res.json()
      setReport(data)
    } catch (err) {
      console.error('Failed to load cash flow report:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDownloadCsv = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports/cash-flow/export?year=${year}`,
        { headers: authHeaders() }
      )
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cash-flow-${year}.csv`
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
      <AppHeader user={user} breadcrumbs={[{ label: 'Money & Bookkeeping', href: '/tools/bookkeeping' }, { label: 'Cash Flow' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Cash Flow Statement</h1>
            <p className="font-inter text-gray-600">
              Net cash movement by activity, built from your Bookkeeping ledger. To reclassify a
              transaction as investing or financing, edit it on the Bookkeeping page.
            </p>
          </div>
          <Link href="/tools/bookkeeping" className="font-inter text-sm text-gold hover:underline mt-2">
            ← Back to Bookkeeping
          </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Operating Activities</p>
                <p className={`font-garamond text-3xl font-medium ${report.operating >= 0 ? 'text-navy' : 'text-error'}`}>
                  ${fmt(report.operating)}
                </p>
              </div>
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Investing Activities</p>
                <p className={`font-garamond text-3xl font-medium ${report.investing >= 0 ? 'text-navy' : 'text-error'}`}>
                  ${fmt(report.investing)}
                </p>
              </div>
              <div className="card">
                <p className="font-inter text-sm text-gray-600 mb-2">Financing Activities</p>
                <p className={`font-garamond text-3xl font-medium ${report.financing >= 0 ? 'text-navy' : 'text-error'}`}>
                  ${fmt(report.financing)}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gold p-8">
              <p className="font-inter text-sm text-gray-600 mb-2">Net Change in Cash</p>
              <p className={`font-garamond text-4xl font-bold ${report.net_change_in_cash >= 0 ? 'text-navy' : 'text-error'}`}>
                ${fmt(report.net_change_in_cash)}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
