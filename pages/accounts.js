import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

export default function Accounts() {
  const [user, setUser] = useState(null)
  const [consumerAccounts, setConsumerAccounts] = useState([])
  const [businessAccounts, setBusinessAccounts] = useState([])
  const [showAddAccountModal, setShowAddAccountModal] = useState(false)
  const [accountType, setAccountType] = useState('consumer')
  const [formData, setFormData] = useState({
    accountName: '',
    creditLimit: ''
  })
  const [loading, setLoading] = useState(false)

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

  const handleAddAccount = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = accountType === 'consumer'
        ? '/api/consumer-accounts'
        : '/api/business-accounts'

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          account_name: formData.accountName,
          credit_limit: parseFloat(formData.creditLimit)
        })
      })

      if (response.ok) {
        setFormData({ accountName: '', creditLimit: '' })
        setShowAddAccountModal(false)
        loadAccounts(user.id)
      }
    } catch (err) {
      console.error('Failed to add account:', err)
    } finally {
      setLoading(false)
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
        <p className="font-inter text-gray-600 mb-8">
          Manage your consumer and business credit accounts
        </p>

        {/* Add Account Button */}
        <button
          onClick={() => setShowAddAccountModal(true)}
          className="btn-primary mb-12"
        >
          + Add New Account
        </button>

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
                        ${account.credit_limit?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="text-navy font-medium">
                        ${account.current_balance?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-success font-medium">
                        {account.payment_status}
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
                        ${account.credit_limit?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Balance:</span>
                      <span className="text-navy font-medium">
                        ${account.current_balance?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-navy bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="font-garamond text-2xl font-medium text-navy mb-6">
              Add New Account
            </h2>

            <form onSubmit={handleAddAccount} className="space-y-6">
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full"
                >
                  <option value="consumer">Consumer</option>
                  <option value="business">Business</option>
                </select>
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  {accountType === 'consumer' ? 'Card/Loan Name' : 'Business Name'}
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                  placeholder={accountType === 'consumer' ? 'e.g., Chase Sapphire' : 'Your Business LLC'}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Credit Limit (optional)
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  placeholder="10000"
                  className="w-full"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                >
                  {loading ? 'Adding...' : 'Add Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
