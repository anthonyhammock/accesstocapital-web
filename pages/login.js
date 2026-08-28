import Link from 'next/link'
import { AvatarLogo } from '@/components/LogoComponent'

export default function Login() {
  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AvatarLogo size="sm" />
            <span className="font-garamond font-bold text-navy text-lg">Access to Capital</span>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-lightgray rounded-lg p-12">
            <h1 className="font-garamond text-3xl font-medium text-navy mb-2">Welcome Back</h1>
            <p className="font-inter text-gray-600 mb-8">Sign in to your account</p>

            <form className="space-y-6">
              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-lightgray rounded focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-navy block mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-lightgray rounded focus:outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary text-center"
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <hr className="my-8" />

            {/* Sign up link - FIXED: Using double quotes for outer string */}
            <p className="font-inter text-center text-navy">
              {"Don't have an account? "}
              <Link href="/register" className="text-gold font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Security note */}
          <p className="font-inter text-sm text-gray-600 text-center mt-8">
            Your data is encrypted and secure.
          </p>
        </div>
      </main>
    </div>
  )
}
