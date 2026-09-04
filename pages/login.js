import { useState } from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Login failed')
        setLoading(false)
        return
      }

      // Save user to localStorage and go to the accounts dashboard
      localStorage.setItem('user', JSON.stringify(data.user))
      window.location.href = '/dashboard'

    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Login error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AvatarLogo size="sm" />
            <span className="font-garamond font-bold text-navy text-lg">Access to Capital</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-lightgray p-12">
            <h1 className="font-garamond text-3xl font-medium text-navy mb-2">Welcome Back</h1>
            <p className="font-inter text-gray-600 mb-8">Sign in to your account</p>

            {error && (
              <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  required
                />
              </div>

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
                  className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary text-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <hr className="my-8" />

            <p className="font-inter text-center text-navy">
              {"Don't have an account? "}
              <Link href="/register" className="text-gold font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <p className="font-inter text-xs text-gray-600 text-center mt-8">
            Your data is encrypted and protected by enterprise-grade security.
          </p>
        </div>
      </main>
    </div>
  )
}
