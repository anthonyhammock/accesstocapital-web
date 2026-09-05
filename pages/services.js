import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'

const services = [
  {
    name: 'Personal Credit Building',
    price: '$10/month',
    description:
      'Automated, transparent reporting to major credit bureaus builds your personal credit profile in the background — no manual data entry required.',
  },
  {
    name: 'Business Credit Building',
    price: '$50/month per business',
    description:
      'Establish credit history that lenders trust for every business you own. Add as many businesses as you run, each with its own reporting.',
  },
  {
    name: 'Federal Tax Deduction Access',
    price: 'Included',
    description:
      'Upload your transactions and BlissPoint Access automatically finds every federal deduction you qualify for, mapped straight to the right form line.',
  },
  {
    name: 'The Next Chapter',
    price: 'Coming soon',
    description:
      'BlissPoint Access is expanding into a full small business ecosystem — additional essential tools are on the way for owners who expect more.',
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
        <p className="font-inter text-xs tracking-[0.25em] uppercase text-gold mb-4 text-center">
          Your Bliss Point
        </p>
        <h1 className="font-cormorant text-5xl font-medium text-navy mb-6 text-center">
          Everything BlissPoint Access Offers
        </h1>
        <p className="font-inter text-lg text-gray-600 mb-16 max-w-2xl mx-auto text-center leading-relaxed">
          One ecosystem, built for owners who expect more for their businesses.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {services.map((service) => (
            <div key={service.name} className="card">
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-garamond text-2xl text-navy">{service.name}</h3>
                <span className="font-inter text-sm text-gold font-medium whitespace-nowrap ml-4">
                  {service.price}
                </span>
              </div>
              <p className="font-inter text-navy">{service.description}</p>
            </div>
          ))}
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
