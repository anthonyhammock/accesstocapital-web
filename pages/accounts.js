import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

export default function Accounts() {
  const [user, setUser] = useState(null)
  const [consumerAccounts, setConsumerAccounts] = useState([])
  const [businessAccounts, setBusinessAccounts] = useState([])

  useEffect(() => {
    // Load user data from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      loadAccounts(userData.id)
    }
  }, [])

  const loadAccounts = async (userId) => {
    try {
      // Load consumer accounts
      const consumerRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/consumer-accounts?user_id=${userId}`
      )
      const consumerData = await consumerRes.json()
      setConsumerAccounts(consumerData.accounts || [])

      // Load business accounts
      const businessRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/business-accounts?user_id=${userId}`
      )
      const businessData = await businessRes.json()
      setBusinessAccounts(businessData.accounts || [])
    } catch (err) {
      console.error('Failed to load accounts:', err)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-navy">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <AvatarLogo size="sm" />
            <span className="font-garamond text-navy font-medium">Access to Capital</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="font-inter text-sm text-navy">
              Welcome, {user.first_name}
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('user')
                window.location.href = '/login'
              }}
              className="text-gold font-medium hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">
          Your Credit Accounts
        </h1>
        <p className="font-inter text-gray-600 mb-12">
          These accounts are automatically created and reported to the credit bureaus each month as part of your subscription.
        </p>

        {/* Consumer Accounts */}
        <div className="mb-12">
          <h2 className="font-garamond text-2xl font-medium text-navy mb-6">
            Consumer Accounts
          </h2>
          {consumerAccounts.length === 0 ? (
            <p className="font-inter text-gray-600">No consumer accounts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consumerAccounts.map(account => (
                <div key={account.id} className="card">
                  <h3 className="font-garamond text-lg text-navy mb-4">
                    {account.account_name}
                  </h3>
                  <div className="space-y-3 font-inter text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="text-navy font-medium">
                        {account.credit_limit != null ? `$${account.credit_limit.toLocaleString()}` : 'Not yet set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="text-navy font-medium">
                        ${(account.current_balance ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-success font-medium">
                        {account.payment_status || 'Not yet reported'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Business Accounts */}
        <div>
          <h2 className="font-garamond text-2xl font-medium text-navy mb-6">
            Business Accounts
          </h2>
          {businessAccounts.length === 0 ? (
            <p className="font-inter text-gray-600">No business accounts yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessAccounts.map(account => (
                <div key={account.id} className="card">
                  <h3 className="font-garamond text-lg text-navy mb-4">
                    {account.business_name}
                  </h3>
                  <div className="space-y-3 font-inter text-sm">
                    {account.ein && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">EIN:</span>
                        <span className="text-navy font-medium">{account.ein}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Limit:</span>
                      <span className="text-navy font-medium">
                        {account.credit_limit != null ? `$${account.credit_limit.toLocaleString()}` : 'Not yet set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="text-navy font-medium">
                        ${(account.current_balance ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
