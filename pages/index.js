import Link from 'next/link'
import { HeaderLogo, AvatarLogo } from '../src/components/LogoComponent'

const heroGradient = 'linear-gradient(180deg, #8A7B5C 0%, #C9C0B3 55%, #F7F4EF 100%)'

export default function Home() {
  return (
    <div className="min-h-screen bg-offwhite">
      {/* Hero */}
      <div style={{ background: heroGradient }}>
        <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <HeaderLogo size="md" />
          <nav className="flex gap-8">
            <Link href="/login" className="font-inter text-sm text-navy hover:text-gold transition-colors">
              Sign In
            </Link>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-6 pt-16 pb-40 text-center flex flex-col items-center">
          <AvatarLogo size="lg" className="mb-6" />

          <p className="font-inter text-xs tracking-[0.25em] uppercase text-navy mb-8">
            Your All-in-One Small Business Ecosystem
          </p>

          <h1 className="font-cormorant text-6xl md:text-7xl font-medium text-navy mb-8 leading-tight">
            BlissPoint Access
          </h1>

          <p className="font-inter text-lg text-navy max-w-2xl leading-relaxed mb-12">
            Automated personal and business credit-building, simplified access to all federal
            tax deductions, and the next chapter of essential business tools — one ecosystem,
            built for owners who expect more for their businesses.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register">
              <button className="btn-primary">Get Started</button>
            </Link>
            <Link href="/services">
              <button className="btn-secondary">Access Your Bliss Point</button>
            </Link>
          </div>
        </main>
      </div>

      {/* Featured story */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="bg-lightgray" style={{ aspectRatio: '4 / 5' }}>
          <img
            src="/images/business-owner.png"
            alt="A successful Black business owner"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <p className="font-inter text-xs tracking-[0.25em] uppercase text-gold mb-4">
            Built For Owners Like You
          </p>
          <h2 className="font-garamond text-4xl text-navy font-medium mb-6 leading-tight">
            Every Tool Your Business Deserves, In One Place
          </h2>
          <p className="font-inter text-lg text-gray-600 mb-8 leading-relaxed">
            From personal and business credit-building to automated tax deductions and the
            tools coming next, BlissPoint Access is built for owners who expect more for
            their businesses.
          </p>
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
