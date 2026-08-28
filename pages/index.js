export default function Home() {
  return (
    <div className="min-h-screen bg-off-white">
     import Link from 'next/link'
import { HeaderLogo } from '@/components/LogoComponent'

export default function Home() {
  return (
    <div className="min-h-screen bg-offwhite">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <HeaderLogo size="md" />
          <nav className="flex gap-8">
            <Link href="/login" className="text-navy hover:text-gold transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Rest of page stays the same... */}
          <a href="/login" className="text-navy hover:text-gold">Sign In</a>
        </div>
      </nav>
      
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold text-navy mb-6">
          Access to Capital | Your Personal Business and Consumer Credit Builder
        </h2>
        <p className="text-lg text-neutral mb-12">
          Build your credit profile through transparent financial reporting.
        </p>
        <button className="bg-gold text-navy px-8 py-3 rounded font-bold">
          Get Started
        </button>
      </main>
    </div>
  )
}
