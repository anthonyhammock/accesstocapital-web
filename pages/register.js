import { useState } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    account_type: 'consumer'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      // Send to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          account_type: formData.account_type
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Registration failed')
        setLoading(false)
        return
      }

      setSuccess('Registration successful! Redirecting to login...')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AvatarLogo size="sm" />
            <span className="font-garamond font-medium text-navy text-lg">Access to Capital</span>
          </Link>
        </div>
      </header>

      {/* Registration Form */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-lightgray rounded-lg p-12">
            <h1 className="font-garamond text-3xl font-medium text-navy mb-2">Create Account</h1>
            <p className="font-inter text-gray-600 mb-8">Join Access to Capital today</p>

            {/* Error message */}
            {error && (
              <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-success bg-opacity-10 border border-success text-success px-4 py-3 rounded mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full"
                  required
                />
              </div>

              {/* Account Type */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Account Type
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className="w-full"
                >
                  <option value="consumer">Consumer (Personal Credit)</option>
                  <option value="business">Business (Business Credit)</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-600 mt-2">At least 8 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full"
                  required
                />
              </div>

              {/* Sign up button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary text-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Divider */}
            <hr className="my-8" />

            {/* Login link */}
            <p className="font-inter text-center text-navy">
              Already have an account?{' '}
              <Link href="/login" className="text-gold font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Data privacy note */}
          <p className="font-inter text-xs text-gray-600 text-center mt-8">
            Your data is encrypted and protected by enterprise-grade security.
          </p>
        </div>
      </main>
    </div>
  )
}
