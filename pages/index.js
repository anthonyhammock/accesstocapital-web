import Link from 'next/link'
import { HeaderLogo } from '../src/components/LogoComponent'

const heroGradient = 'linear-gradient(180deg, #1A1817 0%, #3A342E 45%, #8A7B5C 70%, #C9C0B3 88%, #F7F4EF 100%)'

export default function Home() {
  return (
    <div className="min-h-screen bg-offwhite">
      {/* Hero */}
      <div style={{ background: heroGradient }}>
        <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <HeaderLogo size="md" reversed />
          <nav className="flex gap-8">
            <Link href="/login" className="font-inter text-sm text-offwhite hover:text-platinum transition-colors">
              Sign In
            </Link>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 pt-16 pb-40 text-center flex flex-col items-center">
          <p className="font-inter text-xs tracking-[0.25em] uppercase text-platinum mb-8">
            Your All-in-One Small Business Ecosystem
          </p>

          <h1 className="font-cormorant text-6xl md:text-7xl font-medium text-offwhite mb-8 leading-tight">
            BlissPoint Access
          </h1>

          <p className="font-inter text-lg text-platinum max-w-2xl leading-relaxed mb-12">
            Automated personal and business credit-building, simplified access to all federal
            tax deductions, and the next chapter of essential business tools — one ecosystem,
            built for owners who expect more for their businesses.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <button className="btn-primary">Get Started</button>
            </Link>
            <Link href="/services">
              <button className="btn-outline-light">Access Your Bliss Point</button>
            </Link>
          </div>
        </main>
      </div>

      {/* Services teaser */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">For Consumers</h3>
            <p className="font-inter text-navy">
              Build your personal credit profile through automated, transparent reporting.
              Starting at $10/month.
            </p>
          </div>

          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">For Businesses</h3>
            <p className="font-inter text-navy">
              Establish business credit that lenders trust, and add every business you own.
              Starting at $50/month per business.
            </p>
          </div>

          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">Growing Ecosystem</h3>
            <p className="font-inter text-navy">
              Automated federal tax deduction discovery today, with new essential business
              tools on the way.
            </p>
          </div>
        </div>

        <div className="text-center mt-16">
          <Link href="/services" className="font-inter text-sm text-gold hover:underline">
            See everything BlissPoint Access offers →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-offwhite py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-garamond text-lg mb-2">BlissPoint Access</p>
          <p className="font-inter text-sm text-gray-300">Your All-in-One Small Business Ecosystem</p>
          <p className="font-inter text-xs text-gray-400 mt-12">
            © 2026 BlissPoint Access. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
