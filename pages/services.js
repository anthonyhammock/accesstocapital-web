import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

// Every card must be clickable (policy from the team): Tier 1 tools — quick,
// free, no-signup utilities — link straight to the public tool page once
// one exists; everything else requires an account and routes to /register
// (which also offers "Sign in" for existing users). None of today's
// services are Tier 1 yet, so every href below is /register — when a Tier 1
// tool ships as a real public page, point its own href there directly.
const services = [
  {
    name: 'Personal Credit Building',
    price: '$10/month',
    description:
      'Automated, transparent reporting to major credit bureaus builds your personal credit profile in the background — no manual data entry required.',
    featured: true,
    href: '/register',
  },
  {
    name: 'Business Credit Building',
    price: '$50/month per business',
    description:
      'Establish credit history that lenders trust for every business you own. Add as many businesses as you run, each with its own reporting.',
    featured: true,
    href: '/register',
  },
  {
    name: 'Federal Tax Deduction Access',
    price: 'Included w/ Business or Personal',
    description:
      'Upload your transactions and BlissPoint Access automatically finds every federal deduction you qualify for, mapped straight to the right form line.',
    href: '/register',
  },
  {
    name: 'Bookkeeping, Profit & Loss, and Cash Flow',
    price: 'Included w/ Business or Personal',
    description:
      'Track income and expenses in one ledger, then see your profit & loss and cash flow statements built automatically from it — no separate data entry.',
    href: '/register',
  },
  {
    name: 'Client Portal & Document Collaboration',
    price: 'Included w/ Business or Personal',
    description:
      'Share documents with your clients through a private link — no account required on their end. They can view, download, upload their own files, and comment, all in one place.',
    href: '/register',
  },
  {
    name: 'Scheduling & Booking Links',
    price: 'Included w/ Business or Personal',
    description:
      'Set your weekly availability once and share a booking link — clients see your real open times in their own timezone and book themselves, no back-and-forth.',
    href: '/register',
  },
  {
    name: 'Trading Signals (Beta)',
    price: 'Included w/ Business or Personal',
    description:
      'Educational technical-analysis signals for stocks you watch, delivered as alerts — not investment advice, and you always execute manually on your own broker. Currently in beta.',
    href: '/register',
  },
  {
    name: 'Vendor & AP Management',
    price: 'Included w/ Business or Personal',
    description:
      'Track every vendor, the bills you owe them, and payments as you make them — with an aging report so nothing slips past due.',
    href: '/register',
  },
  {
    name: 'The Next Chapter',
    price: 'Coming soon',
    description:
      'Payroll and benefits, embedded business banking with virtual cards, business insurance, cross-border payments, and small business lending — the next essential tools joining the ecosystem.',
    href: '/register',
  },
]

export default function Services() {
  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AvatarLogo size="sm" />
            <span className="font-garamond font-medium text-navy text-lg">BlissPoint Access</span>
          </Link>
          <nav className="flex gap-8">
            <Link href="/login" className="font-inter text-sm text-navy hover:text-gold transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-20 w-full">
        <AvatarLogo size="lg" className="mx-auto mb-6" />

        <p className="font-inter text-xs tracking-[0.25em] uppercase text-gold mb-4 text-center">
          Your Bliss Point
        </p>
        <h1 className="font-cormorant text-5xl font-medium text-gold mb-6 text-center">
          Everything BlissPoint Access Offers
        </h1>
        <p className="font-inter text-lg text-gray-600 mb-16 max-w-2xl mx-auto text-center leading-relaxed">
          One ecosystem, built for owners who expect more for their businesses.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {services.map((service) =>
            service.featured ? (
              <Link key={service.name} href={service.href}>
                <div className="p-10 h-full cursor-pointer transition hover:opacity-90" style={{ backgroundColor: '#5A4A30' }}>
                  <h3 className="font-garamond text-3xl text-offwhite mb-2">{service.name}</h3>
                  <p className="font-inter text-sm text-offwhite font-medium mb-4">{service.price}</p>
                  <p className="font-inter text-offwhite">{service.description}</p>
                </div>
              </Link>
            ) : (
              <Link key={service.name} href={service.href}>
                <div className="card cursor-pointer h-full">
                  <h3 className="font-garamond text-2xl text-navy mb-1">{service.name}</h3>
                  <p className="font-inter text-xs text-gold font-medium uppercase tracking-wide mb-4">
                    {service.price}
                  </p>
                  <p className="font-inter text-navy">{service.description}</p>
                </div>
              </Link>
            )
          )}
        </div>

        <div className="text-center">
          <Link href="/register">
            <button className="btn-primary">Get Started</button>
          </Link>
        </div>
      </main>

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
