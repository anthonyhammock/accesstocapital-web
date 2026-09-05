import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

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
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AvatarLogo size="sm" />
            <span className="font-garamond text-navy text-base tracking-wide">BlissPoint Access</span>
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
          <div className="bg-white border border-lightgray p-8 hover:border-navy transition">
            <Link href="/tax/upload" className="cursor-pointer">
              <h2 className="font-garamond text-2xl text-navy mb-4">📊 Tax Deductions</h2>
              <p className="font-inter text-gray-600 mb-6">
                Upload bank statements. We automatically identify every business deduction and map them to your tax forms.
              </p>
              <p className="text-gold font-semibold">Start Upload →</p>
            </Link>
            <Link href="/tax/questionnaire">
              <p className="text-gold font-semibold mt-2">Or answer a few questions instead →</p>
            </Link>
          </div>

          {/* Credit Builder */}
          <Link href="/accounts">
            <div className="bg-white border border-lightgray p-8 hover:border-navy cursor-pointer transition">
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
