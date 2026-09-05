import { useState, useEffect } from 'react'
import AppHeader from '../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../src/lib/auth'

const ACCOUNT_TYPE_LABELS = {
  consumer: 'Personal',
  business: 'Business',
  both: 'Personal + Business'
}

export default function Accounts() {
  const { user, ready } = useAuthGuard()
  const [accountType, setAccountType] = useState(null)
  const [consumerAccounts, setConsumerAccounts] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [showAddBusiness, setShowAddBusiness] = useState(false)
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    ein: '',
    business_type: '',
    annual_revenue: ''
  })
  const [addingBusiness, setAddingBusiness] = useState(false)
  const [addBusinessError, setAddBusinessError] = useState('')
  const [addingConsumer, setAddingConsumer] = useState(false)
  const [addConsumerError, setAddConsumerError] = useState('')

  useEffect(() => {
    if (ready) {
      loadAccounts()
    }
  }, [ready])

  const loadAccounts = async () => {
    try {
      // /api/me is the source of truth for account_type — it can change
      // after signup (adding a business or personal account later), so the
      // copy cached in localStorage at login time may be stale.
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/me`, { headers: authHeaders() })
      const meData = await meRes.json()
      setAccountType(meData.account_type)

      const consumerRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/consumer-accounts`,
        { headers: authHeaders() }
      )
      const consumerData = await consumerRes.json()
      setConsumerAccounts(consumerData.accounts || [])

      // Load businesses (each is a group of tradeline accounts)
      const businessRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/businesses`,
        { headers: authHeaders() }
      )
      const businessData = await businessRes.json()
      setBusinesses(businessData.businesses || [])
    } catch (err) {
      console.error('Failed to load accounts:', err)
    }
  }

  const handleAddConsumer = async () => {
    setAddingConsumer(true)
    setAddConsumerError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/consumer-accounts`, {
        method: 'POST',
        headers: authHeaders()
      })
      const data = await response.json()

      if (!response.ok) {
        setAddConsumerError(data.detail || 'Could not add personal credit building.')
        return
      }

      loadAccounts()
    } catch (err) {
      setAddConsumerError('Network error. Please try again.')
    } finally {
      setAddingConsumer(false)
    }
  }

  const handleAddBusiness = async (e) => {
    e.preventDefault()
    setAddingBusiness(true)
    setAddBusinessError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          business_name: businessForm.business_name,
          ein: businessForm.ein || undefined,
          business_type: businessForm.business_type || undefined,
          annual_revenue: businessForm.annual_revenue ? parseFloat(businessForm.annual_revenue) : undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setAddBusinessError(data.detail || 'Could not add business')
        setAddingBusiness(false)
        return
      }

      setBusinessForm({ business_name: '', ein: '', business_type: '', annual_revenue: '' })
      setShowAddBusiness(false)
      loadAccounts()
    } catch (err) {
      setAddBusinessError('Network error. Please try again.')
    } finally {
      setAddingBusiness(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-navy">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite">
      <AppHeader user={user} breadcrumbs={[{ label: 'Build Credit' }]} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center gap-4 mb-2">
          <h1 className="font-garamond text-4xl font-medium text-navy">
            Your Credit Accounts
          </h1>
          {accountType && (
            <span className="font-inter text-xs font-semibold uppercase tracking-wide px-3 py-1 bg-gold bg-opacity-10 text-gold">
              {ACCOUNT_TYPE_LABELS[accountType] || accountType} Account
            </span>
          )}
        </div>
        <p className="font-inter text-gray-600 mb-12">
          These accounts are automatically created and reported to the credit bureaus each month as part of your subscription.
        </p>

        {/* Consumer Accounts */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-garamond text-2xl font-medium text-navy">
              Consumer Accounts
            </h2>
            {consumerAccounts.length === 0 && (
              <button onClick={handleAddConsumer} disabled={addingConsumer} className="btn-primary disabled:opacity-50">
                {addingConsumer ? 'Adding...' : '+ Add Personal Credit Building'}
              </button>
            )}
          </div>

          {addConsumerError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              {addConsumerError}
            </div>
          )}

          {consumerAccounts.length === 0 ? (
            <p className="font-inter text-gray-600">
              No personal credit builder account yet — $10/month, reported to all major consumer bureaus.
            </p>
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

        {/* Businesses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-garamond text-2xl font-medium text-navy">
              Businesses
            </h2>
            <button
              onClick={() => setShowAddBusiness(!showAddBusiness)}
              className="btn-primary"
            >
              {showAddBusiness ? 'Cancel' : '+ Add Another Business'}
            </button>
          </div>

          {showAddBusiness && (
            <form onSubmit={handleAddBusiness} className="bg-white border border-lightgray p-8 mb-8 space-y-6">
              <p className="font-inter text-sm text-gray-600">
                Each additional business is <strong>$50/month</strong>, reported to the business credit bureaus.
                Billing isn't set up yet, so this business will be added now and billing will begin once payment
                setup is complete — you won't be charged today.
              </p>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Business Name</label>
                <input
                  type="text"
                  value={businessForm.business_name}
                  onChange={(e) => setBusinessForm({ ...businessForm, business_name: e.target.value })}
                  placeholder="Your Business LLC"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">EIN (optional)</label>
                <input
                  type="text"
                  value={businessForm.ein}
                  onChange={(e) => setBusinessForm({ ...businessForm, ein: e.target.value })}
                  placeholder="12-3456789"
                  className="w-full"
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Business Type (optional)</label>
                <select
                  value={businessForm.business_type}
                  onChange={(e) => setBusinessForm({ ...businessForm, business_type: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select type</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="LLC">LLC</option>
                  <option value="S-Corporation">S-Corporation</option>
                  <option value="C-Corporation">C-Corporation</option>
                  <option value="Partnership">Partnership</option>
                </select>
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">Annual Revenue (optional)</label>
                <input
                  type="number"
                  value={businessForm.annual_revenue}
                  onChange={(e) => setBusinessForm({ ...businessForm, annual_revenue: e.target.value })}
                  placeholder="250000"
                  className="w-full"
                />
              </div>

              {addBusinessError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {addBusinessError}
                </div>
              )}

              <button
                type="submit"
                disabled={addingBusiness}
                className="btn-primary disabled:opacity-50"
              >
                {addingBusiness ? 'Adding...' : 'Add Business'}
              </button>
            </form>
          )}

          {businesses.length === 0 ? (
            <p className="font-inter text-gray-600">No businesses yet</p>
          ) : (
            <div className="space-y-8">
              {businesses.map(business => (
                <div key={business.business_group_id || business.business_name} className="bg-white border border-lightgray p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-garamond text-xl text-navy font-bold">
                        {business.business_name}
                      </h3>
                      {business.ein && (
                        <p className="font-inter text-sm text-gray-600">EIN: {business.ein}</p>
                      )}
                      {business.business_type && (
                        <p className="font-inter text-sm text-gray-600">{business.business_type}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-inter text-lg font-bold text-gold">${business.monthly_fee.toFixed(2)}/mo</p>
                      <p className="font-inter text-xs text-gray-500">
                        {business.billing_status === 'pending_payment_setup' ? 'Billing not yet active' : business.billing_status}
                      </p>
                    </div>
                  </div>
                  <p className="font-inter text-sm text-gray-600">
                    {business.account_ids.length} tradeline account(s) reported under this business
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
