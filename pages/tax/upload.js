import React, { useState } from 'react'
import Link from 'next/link'
import AppHeader from '../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../src/lib/auth'

export default function TaxUpload() {
  const { user, ready } = useAuthGuard()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = (e) => {
    setFile(e.target.files[0])
    setError('')
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tax/upload-csv`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Upload failed')
        setUploading(false)
        return
      }

      setTransactions(data.transactions)
      setUploadComplete(true)
      setUploading(false)

    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Upload error:', err)
      setUploading(false)
    }
  }

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Taxes' }, { label: 'Tax Deductions' }]} />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-gold mb-2">Upload Bank Statements</h1>
        <p className="font-inter text-gray-600 mb-12">We'll automatically categorize your business expenses.</p>

        {!uploadComplete && (
          <div className="bg-white border border-lightgray p-12 mb-8">
            <div className="text-center">
              <h2 className="font-garamond text-2xl text-navy mb-3">Choose CSV File</h2>
              <p className="font-inter text-gray-600 mb-6">Chase, Amex, Bank of America, or generic CSV</p>

              <div className="mb-6">
                <label className="relative inline-block cursor-pointer">
                  <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                  <span className="inline-block px-8 py-3 bg-navy text-white hover:bg-opacity-90">
                    Select File
                  </span>
                </label>
              </div>

              {file && (
                <div className="mb-6 p-4 bg-offwhite border border-lightgray">
                  <p className="font-inter text-navy font-medium">{file.name}</p>
                  <p className="font-inter text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-8 py-3 bg-navy text-offwhite hover:bg-opacity-90 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload & Categorize'}
              </button>
            </div>
          </div>
        )}

        {uploadComplete && transactions.length > 0 && (
          <div className="bg-white border border-lightgray p-8 mb-8">
            <h2 className="font-garamond text-2xl text-navy mb-6">Imported Transactions ({transactions.length})</h2>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-offwhite">
                  <tr>
                    <th className="px-6 py-3 font-inter font-semibold text-navy">Date</th>
                    <th className="px-6 py-3 font-inter font-semibold text-navy">Merchant</th>
                    <th className="px-6 py-3 font-inter font-semibold text-navy">Amount</th>
                    <th className="px-6 py-3 font-inter font-semibold text-navy">Category</th>
                    <th className="px-6 py-3 font-inter font-semibold text-navy">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.slice(0, 20).map((tx, i) => (
                    <tr key={i} className="hover:bg-offwhite">
                      <td className="px-6 py-4 font-inter text-gray-700">{tx.date}</td>
                      <td className="px-6 py-4 font-inter text-gray-700">{tx.merchant}</td>
                      <td className="px-6 py-4 font-inter font-medium text-navy">${Math.abs(tx.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-gold bg-opacity-10 text-gold text-xs font-medium">
                          {tx.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-inter text-sm text-gray-600">
                        {tx.confidence ? `${(tx.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <Link href="/tax/calculate">
                <button className="px-8 py-3 bg-gold text-offwhite hover:bg-opacity-90">
                  Continue to Calculation
                </button>
              </Link>
              <button onClick={() => {
                setUploadComplete(false)
                setTransactions([])
                setFile(null)
              }} className="px-8 py-3 border border-lightgray text-navy font-medium hover:bg-offwhite">
                Upload Different File
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
