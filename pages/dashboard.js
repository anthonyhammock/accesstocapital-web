import React from 'react'
import Link from 'next/link'
import { AvatarLogo } from '../src/components/LogoComponent'
import { useAuthGuard, logout } from '../src/lib/auth'

// Every tool lists itself here under a plain-English category. A category
// only renders once it has at least one tool in it — add a new tool to a
// new or existing category and the dashboard updates itself, no layout
// rework needed as the tool list grows.
const TOOL_CATEGORIES = [
  {
    name: 'Taxes',
    tools: [
      {
        icon: '📊',
        name: 'Tax Deductions',
        description: 'Upload bank statements. We automatically identify every business deduction and map them to your tax forms.',
        href: '/tax/upload',
        cta: 'Start Upload →',
        secondary: { href: '/tax/questionnaire', label: 'Or answer a few questions instead →' }
      }
    ]
  },
  {
    name: 'Money & Bookkeeping',
    tools: [
      {
        icon: '🧾',
        name: 'Bookkeeping',
        description: 'Track income and expenses in one ledger, saved to your account automatically and ready to download anytime.',
        href: '/tools/bookkeeping',
        cta: 'Open Ledger →'
      },
      {
        icon: '📈',
        name: 'Profit & Loss',
        description: 'See revenue, expenses by category, and net income — built automatically from your bookkeeping ledger.',
        href: '/tools/profit-and-loss',
        cta: 'View Statement →'
      },
      {
        icon: '💵',
        name: 'Cash Flow',
        description: 'See net cash movement by operating, investing, and financing activity for any year.',
        href: '/tools/cash-flow',
        cta: 'View Statement →'
      }
    ]
  }
]

export default function Dashboard() {
  const { user, ready } = useAuthGuard()

  if (!ready) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <AvatarLogo size="sm" />
            <span className="font-garamond text-navy text-base tracking-wide">BlissPoint Access</span>
          </Link>
          <button onClick={logout} className="text-navy hover:text-gold">
            Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="font-garamond text-4xl font-medium text-navy mb-2">
            Welcome, {user.first_name}
          </h1>
          <p className="font-inter text-gray-600">Choose a service to get started.</p>
        </div>

        {/* Build Credit — the primary way this business earns revenue, so it
            stands alone as a full-width banner rather than sharing a grid
            slot with everything else. */}
        <Link href="/accounts">
          <div className="p-10 mb-12 cursor-pointer transition hover:opacity-90" style={{ backgroundColor: '#5A4A30' }}>
            <h2 className="font-garamond text-3xl text-offwhite mb-4">💳 Build Credit</h2>
            <p className="font-inter text-offwhite mb-6 max-w-2xl">
              Start building credit history with a secure deposit. Real payment reporting to all major bureaus.
            </p>
            <p className="text-offwhite font-semibold">View Accounts →</p>
          </div>
        </Link>

        {TOOL_CATEGORIES.map((category) => (
          <div key={category.name} className="mb-12">
            <h2 className="font-garamond text-2xl font-medium text-navy mb-6">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {category.tools.map((tool) => (
                <div key={tool.name} className="bg-white border border-lightgray p-8 hover:border-navy transition">
                  <Link href={tool.href} className="cursor-pointer">
                    <h3 className="font-garamond text-2xl text-navy mb-4">{tool.icon} {tool.name}</h3>
                    <p className="font-inter text-gray-600 mb-6">{tool.description}</p>
                    <p className="text-gold font-semibold">{tool.cta}</p>
                  </Link>
                  {tool.secondary && (
                    <Link href={tool.secondary.href}>
                      <p className="text-gold font-semibold mt-2">{tool.secondary.label}</p>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
