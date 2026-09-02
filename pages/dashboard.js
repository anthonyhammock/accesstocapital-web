import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { HeaderLogo } from '../src/components/LogoComponent'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <HeaderLogo size="sm" />
            <span className="font-garamond font-bold text-navy text-lg">BlissPoint</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="text-navy hover:text-gold"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="font-garamond text-4xl font-medium text-navy mb-2">
            Welcome, {user.first_name}
          </h1>
          <p className="font-inter text-gray-600">Choose a service to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tax Platform */}
          <Link href="/tax/upload">
            <div className="bg-white border border-lightgray rounded-lg p-8 hover:shadow-lg cursor-pointer transition">
              <h2 className="font-garamond text-2xl text-navy mb-4">📊 Tax Deductions</h2>
              <p className="font-inter text-gray-600 mb-6">
                Upload bank statements. We automatically identify every business deduction and map them to your tax forms.
              </p>
              <p className="text-gold font-semibold">Start Upload →</p>
            </div>
          </Link>

          {/* Credit Builder */}
          <Link href="/credit-builder/accounts">
            <div className="bg-white border border-lightgray rounded-lg p-8 hover:shadow-lg cursor-pointer transition">
              <h2 className="font-garamond text-2xl text-navy mb-4">💳 Build Credit</h2>
              <p className="font-inter text-gray-600 mb-6">
                Start building credit history with a secure deposit. Real payment reporting to all major bureaus.
              </p>
              <p className="text-gold font-semibold">View Accounts →</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
