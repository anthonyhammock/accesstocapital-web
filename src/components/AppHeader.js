import { useState } from 'react'
import Link from 'next/link'
import { AvatarLogo } from './LogoComponent'
import { logout } from '../lib/auth'

// Every real <Link> here renders as a genuine <a href>, so ctrl/cmd/middle
// click opens it in a new tab natively — no special handling needed for
// that, since the auth token lives in localStorage and is already shared
// across every tab in the same browser.
const QUICK_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Build Credit', href: '/accounts' },
  { label: 'Tax Deductions', href: '/tax/upload' },
  { label: 'Bookkeeping', href: '/tools/bookkeeping' },
  { label: 'Profit & Loss', href: '/tools/profit-and-loss' },
  { label: 'Cash Flow', href: '/tools/cash-flow' },
  { label: 'Balance Sheet', href: '/tools/balance-sheet' },
  { label: 'Client Portal', href: '/tools/client-portal' },
  { label: 'Scheduling', href: '/tools/scheduling' },
  { label: 'Trading Signals', href: '/tools/trading-signals' },
  { label: 'Vendor & AP Management', href: '/tools/vendor-ap' },
  { label: 'Invoicing', href: '/tools/invoicing' },
  { label: 'CRM & Sales Pipeline', href: '/tools/crm' },
]

// breadcrumbs: an array of { label, href? } for everything AFTER "Dashboard"
// (which is always the implicit first crumb). Omit entirely on the
// dashboard page itself. The last entry should omit href — it's "you are
// here" and isn't a link.
export default function AppHeader({ user, breadcrumbs = [] }) {
  const [menuOpen, setMenuOpen] = useState(false)
  // Admin link only ever shown to an account with is_admin=true — the real
  // gate is still the backend's 403 on every /api/admin/* call, this is
  // just so a non-admin never even sees the link.
  const quickLinks = user?.is_admin ? [...QUICK_LINKS, { label: 'Admin Portal', href: '/admin' }] : QUICK_LINKS

  return (
    <header className="bg-white border-b border-lightgray">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <AvatarLogo size="sm" />
            <span className="font-garamond text-navy text-base tracking-wide">BlissPoint Access</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="font-inter text-sm text-navy hover:text-gold flex items-center gap-1"
            >
              Quick Links <span aria-hidden="true">▾</span>
            </button>
            {menuOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white border border-lightgray z-10">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-4 py-3 font-inter text-sm text-navy hover:bg-offwhite hover:text-gold border-b border-lightgray last:border-0"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <span className="font-inter text-sm text-navy hidden sm:inline">Welcome, {user.first_name}</span>
          )}
          <button onClick={logout} className="font-inter text-sm text-navy hover:text-gold">
            Sign Out
          </button>
        </div>
      </div>

      {breadcrumbs.length > 0 && (
        <div className="border-t border-lightgray bg-offwhite">
          <nav className="max-w-6xl mx-auto px-6 py-2 font-inter text-xs text-gray-600">
            <Link href="/dashboard" className="hover:text-gold">Dashboard</Link>
            {breadcrumbs.map((crumb, i) => (
              <span key={i}>
                <span className="mx-2">/</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-gold">{crumb.label}</Link>
                ) : (
                  <span className="text-navy font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
