import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

export default function Accounts() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-offwhite flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <div className="min-h-screen bg-offwhite flex items-center justify-center">Please log in</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AvatarLogo size="sm" />
            <span className="font-garamond font-bold text-navy text-lg">Access to Capital</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="text-navy hover:text-gold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">
          Welcome, {user.first_name}
        </h1>
        <p className="font-inter text-gray-600 mb-12">Manage your credit accounts</p>

        {/* Accounts Section */}
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h2 className="font-garamond text-2xl text-navy mb-6">Your Accounts</h2>
            <div className="bg-white border border-lightgray rounded-lg p-8 text-center">
              <p className="font-inter text-gray-600">No accounts yet. Create your first account to get started.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex gap-4">
          <button className="btn-primary">
            Add Consumer Account
          </button>
          <button className="btn-secondary">
            Add Business Account
          </button>
        </div>
      </main>
    </div>
  )
}
