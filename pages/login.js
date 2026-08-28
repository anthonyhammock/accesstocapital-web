import { AvatarLogo } from '@/components/LogoComponent'
import Link from 'next/link'

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

      {/* Rest of page stays the same... */}
        
        <form className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-light-gray rounded"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-light-gray rounded"
          />
          <button
            type="submit"
            className="w-full bg-gold text-navy py-2 rounded font-bold"
          >
            Sign In
          </button>
        </form>
        
        <p className="text-center mt-8 text-neutral">
          Don't have an account? <Link href="/register" className="text-gold">Create one</Link>
        </p>
      </div>
    </div>
  )
}
