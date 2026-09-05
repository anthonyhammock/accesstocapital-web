import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { AvatarLogo } from '../../src/components/LogoComponent'

// Slots arrive as UTC ISO strings; every date/time shown here is derived by
// handing that string straight to `new Date(...)`, which the browser then
// renders in the visitor's own local timezone automatically — no manual
// timezone math needed on this side.
const groupByLocalDate = (slots) => {
  const groups = {}
  for (const slot of slots) {
    const d = new Date(slot.start_at)
    const key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
    if (!groups[key]) groups[key] = []
    groups[key].push(slot)
  }
  return groups
}

export default function PublicBookingPage() {
  const router = useRouter()
  const { slug } = router.query

  const [portal, setPortal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  useEffect(() => {
    if (slug) {
      loadPage()
    }
  }, [slug])

  const loadPage = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/public/${slug}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setPortal(data)
    } catch (err) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => (portal ? groupByLocalDate(portal.slots) : {}), [portal])

  const handleBook = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_at: selectedSlot.start_at,
          guest_name: guestName,
          guest_email: guestEmail,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Could not book that time. Please pick another.')
        if (res.status === 409) {
          setSelectedSlot(null)
          await loadPage()
        }
        return
      }
      setConfirmed(data)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="bg-white border-b border-lightgray">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-3">
          <AvatarLogo size="sm" />
          <span className="font-garamond font-medium text-navy text-lg">BlissPoint Access</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        {loading ? (
          <p className="font-inter text-gray-600">Loading...</p>
        ) : notFound ? (
          <div className="bg-white border border-lightgray p-10 text-center">
            <h1 className="font-garamond text-2xl text-gold mb-3">Link Not Found</h1>
            <p className="font-inter text-gray-600">
              This booking link is invalid or is no longer accepting bookings.
            </p>
          </div>
        ) : confirmed ? (
          <div className="bg-white border border-gold p-10 text-center">
            <h1 className="font-garamond text-2xl text-gold mb-3">You're Booked!</h1>
            <p className="font-inter text-gray-600 mb-2">
              {new Date(confirmed.start_at).toLocaleString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
            <p className="font-inter text-sm text-gray-500">Booked under {confirmed.guest_email}.</p>
          </div>
        ) : (
          <>
            <p className="font-inter text-xs tracking-[0.2em] uppercase text-gold mb-2">Book a Time</p>
            <h1 className="font-garamond text-4xl font-medium text-gold mb-2">{portal.owner_name}</h1>
            <p className="font-inter text-gray-600 mb-10">{portal.meeting_duration_minutes}-minute meeting</p>

            {!selectedSlot ? (
              Object.keys(grouped).length === 0 ? (
                <p className="font-inter text-gray-600">No open times right now — please check back later.</p>
              ) : (
                <div className="space-y-8">
                  {Object.entries(grouped).map(([date, slots]) => (
                    <div key={date}>
                      <h2 className="font-garamond text-lg text-navy mb-3">{date}</h2>
                      <div className="flex flex-wrap gap-3">
                        {slots.map((slot) => (
                          <button
                            key={slot.start_at}
                            onClick={() => setSelectedSlot(slot)}
                            className="btn-secondary text-sm"
                          >
                            {new Date(slot.start_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white border border-lightgray p-8">
                <button onClick={() => setSelectedSlot(null)} className="font-inter text-sm text-gold hover:underline mb-6">
                  ← Choose a different time
                </button>
                <p className="font-inter text-navy font-medium mb-6">
                  {new Date(selectedSlot.start_at).toLocaleString(undefined, {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </p>
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <label className="font-inter text-sm font-medium text-navy block mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="font-inter text-sm font-medium text-navy block mb-2">Your Email</label>
                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="font-inter text-sm font-medium text-navy block mb-2">Notes (optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
                    />
                  </div>
                  {error && <p className="font-inter text-sm text-error">{error}</p>}
                  <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-navy text-offwhite py-10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="font-inter text-xs text-gray-400">© 2026 BlissPoint Access. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
