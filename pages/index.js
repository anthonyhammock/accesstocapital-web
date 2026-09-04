import Link from 'next/link'
import { HeaderLogo } from '../src/components/LogoComponent'

export default function Home() {
  return (
    <div className="min-h-screen bg-offwhite">
      {/* Header */}
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <HeaderLogo size="md" />
          <nav className="flex gap-8">
            <Link href="/login" className="text-navy hover:text-gold transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-32">
        {/* Main headline */}
        <h1 className="font-garamond text-5xl font-medium text-navy mb-6 leading-tight">
          Build Your Credit
        </h1>
        
        <p className="font-inter text-xl text-navy mb-4">
          with Transparent, Institutional-Grade Reporting
        </p>
        
        <p className="font-inter text-lg text-gray-600 mb-12 max-w-2xl leading-relaxed">
          Access to Capital provides businesses and consumers with transparent credit reporting 
          that builds financial trust and opens doors to opportunity.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 mb-24">
          <button className="btn-primary">
            Get Started
          </button>
          <button className="btn-secondary">
            Learn More
          </button>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">For Consumers</h3>
            <p className="font-inter text-navy">
              Build your credit profile through transparent financial reporting. 
              Access credit accounts starting at $10/month.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">For Businesses</h3>
            <p className="font-inter text-navy">
              Establish business credit that lenders trust. 
              Report to major credit bureaus starting at $50/month.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card">
            <h3 className="font-garamond text-2xl text-navy mb-4">Institutional Grade</h3>
            <p className="font-inter text-navy">
              Multi-zone database with 99.99% uptime. 
              Your financial data is protected like a major bank.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-offwhite py-16 mt-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-garamond text-lg mb-2">Access to Capital</p>
          <p className="font-inter text-sm text-gray-300">Business and Consumer Credit Builder</p>
          <p className="font-inter text-xs text-gray-400 mt-12">
            © 2026 Access to Capital. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
