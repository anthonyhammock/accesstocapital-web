import { useState, useEffect } from 'react'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const FALLBACK_TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney',
]

const getTimezoneOptions = () => {
  // Intl.supportedValuesOf('timeZone') doesn't include the literal string
  // "UTC" in at least Chromium (it only lists IANA zone names) — but "UTC"
  // is exactly what the backend defaults a new owner's settings to. Without
  // this, the <select> has no matching option for that value and silently
  // falls back to displaying whatever zone sorts first, which looks like
  // the owner's timezone even though it isn't what's actually saved.
  let zones = FALLBACK_TIMEZONES
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      zones = Intl.supportedValuesOf('timeZone')
    } catch (err) {
      zones = FALLBACK_TIMEZONES
    }
  }
  return zones.includes('UTC') ? zones : ['UTC', ...zones]
}

const emptyDays = () =>
  Array.from({ length: 7 }, () => ({ enabled: false, start_time: '09:00', end_time: '17:00' }))

export default function SchedulingSettings() {
  const { user, ready } = useAuthGuard()
  const [settings, setSettings] = useState(null)
  const [days, setDays] = useState(emptyDays())
  const [bookings, setBookings] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkBusy, setLinkBusy] = useState(false)
  const [timezoneOptions] = useState(getTimezoneOptions)

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [settingsRes, bookingsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/settings`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/bookings`, { headers: authHeaders() }),
      ])
      const settingsData = await settingsRes.json()
      const bookingsData = await bookingsRes.json()
      setSettings(settingsData)

      const nextDays = emptyDays()
      for (const rule of settingsData.availability || []) {
        nextDays[rule.day_of_week] = { enabled: true, start_time: rule.start_time, end_time: rule.end_time }
      }
      setDays(nextDays)
      setBookings(bookingsData.bookings || [])
    } catch (err) {
      console.error('Failed to load scheduling data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  const updateSettingsField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const updateDay = (index, field, value) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    setSaved(false)
    try {
      const settingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          timezone: settings.timezone,
          meeting_duration_minutes: parseInt(settings.meeting_duration_minutes),
          buffer_minutes: parseInt(settings.buffer_minutes),
          min_notice_hours: parseInt(settings.min_notice_hours),
          is_active: settings.is_active,
        }),
      })
      const settingsData = await settingsRes.json()
      if (!settingsRes.ok) {
        setError(settingsData.detail || 'Could not save settings.')
        return
      }

      const rules = days
        .map((d, index) => ({ ...d, day_of_week: index }))
        .filter((d) => d.enabled)
        .map((d) => ({ day_of_week: d.day_of_week, start_time: d.start_time, end_time: d.end_time }))

      const availabilityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ rules }),
      })
      const availabilityData = await availabilityRes.json()
      if (!availabilityRes.ok) {
        setError(availabilityData.detail || 'Could not save availability.')
        return
      }

      await loadAll()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const bookingUrl = settings ? `${window.location.origin}/book/${settings.booking_slug}` : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('This invalidates the current link — anyone using the old link will lose access. Continue?')) return
    setLinkBusy(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/settings/regenerate-link`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await loadAll()
    } finally {
      setLinkBusy(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await loadAll()
    } catch (err) {
      console.error('Failed to cancel booking:', err)
    }
  }

  if (!ready || loadingData || !settings) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      <AppHeader user={user} breadcrumbs={[{ label: 'Scheduling' }]} />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="font-garamond text-4xl font-medium text-navy mb-2">Scheduling &amp; Booking Links</h1>
        <p className="font-inter text-gray-600 mb-10">
          Set your weekly availability and share your booking link — visitors pick an open time and
          book it themselves, no account required on their end.
        </p>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-4">Your Booking Link</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-[240px] px-4 py-3 border border-lightgray bg-offwhite font-inter text-sm text-navy"
            />
            <button onClick={handleCopy} className="btn-secondary text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleRegenerate} disabled={linkBusy} className="btn-secondary text-sm disabled:opacity-50">
              Regenerate Link
            </button>
          </div>
          <label className="flex items-center gap-2 mt-4 font-inter text-sm text-navy">
            <input
              type="checkbox"
              checked={settings.is_active}
              onChange={(e) => updateSettingsField('is_active', e.target.checked)}
            />
            Accepting bookings
          </label>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-6">Meeting Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Your Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSettingsField('timezone', e.target.value)}
                className="w-full"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Meeting Length (minutes)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={settings.meeting_duration_minutes}
                onChange={(e) => updateSettingsField('meeting_duration_minutes', e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Buffer Between Meetings (minutes)</label>
              <input
                type="number"
                min="0"
                max="120"
                value={settings.buffer_minutes}
                onChange={(e) => updateSettingsField('buffer_minutes', e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
            <div>
              <label className="font-inter text-sm font-medium text-navy block mb-2">Minimum Notice (hours)</label>
              <input
                type="number"
                min="0"
                max="336"
                value={settings.min_notice_hours}
                onChange={(e) => updateSettingsField('min_notice_hours', e.target.value)}
                className="w-full px-4 py-3 border border-lightgray focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-lightgray p-8 mb-10">
          <h2 className="font-garamond text-xl text-navy mb-6">Weekly Availability</h2>
          <div className="space-y-4">
            {DAY_NAMES.map((name, index) => (
              <div key={name} className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 w-36 font-inter text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={days[index].enabled}
                    onChange={(e) => updateDay(index, 'enabled', e.target.checked)}
                  />
                  {name}
                </label>
                {days[index].enabled && (
                  <>
                    <input
                      type="time"
                      value={days[index].start_time}
                      onChange={(e) => updateDay(index, 'start_time', e.target.value)}
                      className="px-3 py-2 border border-lightgray"
                    />
                    <span className="font-inter text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      value={days[index].end_time}
                      onChange={(e) => updateDay(index, 'end_time', e.target.value)}
                      className="px-3 py-2 border border-lightgray"
                    />
                  </>
                )}
              </div>
            ))}
          </div>

          {error && <p className="font-inter text-sm text-error mt-6">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="btn-primary mt-6 disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Availability'}
          </button>
        </div>

        <h2 className="font-garamond text-xl text-navy mb-4">Upcoming Bookings</h2>
        {bookings.length === 0 ? (
          <p className="font-inter text-gray-600">No upcoming bookings.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white border border-lightgray p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-inter font-medium text-navy">{b.guest_name} ({b.guest_email})</p>
                  <p className="font-inter text-sm text-gray-600 mt-1">
                    {new Date(b.start_at).toLocaleString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                  {b.notes && <p className="font-inter text-xs text-gray-500 mt-1">{b.notes}</p>}
                </div>
                <button onClick={() => handleCancelBooking(b.id)} className="font-inter text-sm text-error hover:underline">
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
