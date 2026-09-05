import React, { useState } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

export default function TaxCalculate() {
  const { user, ready } = useAuthGuard()
  const [entityType, setEntityType] = useState('SOLE_PROP')
  const [taxYear, setTaxYear] = useState(2026)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [officerWages, setOfficerWages] = useState(0)

  const handleCalculate = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax/calculate-deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          tax_year: taxYear,
          entity_type: entityType,
          transactions: [],  // Will fetch from DB on backend
          officer_wages: entityType !== 'SOLE_PROP' ? parseFloat(officerWages) : 0
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Calculation failed')
        setLoading(false)
        return
      }

      setResults(data)
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Calculation error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Taxes', href: '/tax/upload' }, { label: 'Calculate Deductions' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Calculate Deductions</h1>
        <p className="font-inter text-gray-600 mb-12">Configure your tax situation and review results.</p>

        {!results && (
          <div className="bg-white border border-lightgray p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Tax Year</label>
                <input
                  type="number"
                  value={taxYear}
                  onChange={(e) => setTaxYear(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Entity Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                >
                  <option value="SOLE_PROP">Sole Proprietor (Schedule C)</option>
                  <option value="S_CORP">S-Corporation (Form 1120-S)</option>
                  <option value="C_CORP">C-Corporation (Form 1120)</option>
                </select>
              </div>

              {entityType !== 'SOLE_PROP' && (
                <div>
                  <label className="font-inter text-sm font-medium text-navy block mb-2">Officer Wages</label>
                  <input
                    type="number"
                    value={officerWages}
                    onChange={(e) => setOfficerWages(e.target.value)}
                    placeholder="50000"
                    className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={loading}
              className="w-full px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'Calculate Deductions'}
            </button>
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <div className="bg-white border border-gold p-8">
              <h2 className="font-garamond text-3xl text-navy font-bold mb-4">
                Total Deductions: <span className="text-gold">${results.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </h2>
              <p className="font-inter text-gray-600">
                Based on {Object.values(results.lines).reduce((sum, line) => sum + line.count, 0)} transactions processed
              </p>
            </div>

            <div className="bg-white border border-lightgray p-8">
              <h3 className="font-garamond text-2xl text-navy font-medium mb-6">Form Line Breakdown</h3>

              <div className="space-y-4">
                {Object.entries(results.lines).map(([formLine, data]) => (
                  <div key={formLine} className="border-l-4 border-gold pl-6 py-4 hover:bg-offwhite">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-garamond text-lg text-navy font-bold">{formLine}</p>
                      <p className="font-inter text-lg font-bold text-gold">
                        ${data.total.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </p>
                    </div>
                    <p className="font-inter text-xs text-gray-500">{data.count} transaction(s)</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Link href="/tax/upload">
                <button className="flex-1 px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90">
                  Upload Another File
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="flex-1 px-8 py-3 border border-lightgray text-navy font-medium hover:bg-offwhite">
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
