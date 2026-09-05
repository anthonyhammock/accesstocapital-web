import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppHeader from '../../../src/components/AppHeader'
import { useAuthGuard, authHeaders } from '../../../src/lib/auth'

const PROVIDER_LABELS = { google: 'Google Calendar', microsoft: 'Outlook / Microsoft 365' }

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
  const router = useRouter()
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
  const [calendarProviders, setCalendarProviders] = useState({ google: false, microsoft: false })
  const [calendarConnections, setCalendarConnections] = useState([])
  const [calendarBusy, setCalendarBusy] = useState(null)
  const [calendarNotice, setCalendarNotice] = useState(null)

  useEffect(() => {
    if (ready) {
      loadAll()
    }
  }, [ready])

  useEffect(() => {
    if (!router.isReady) return
    const { calendar_connected, calendar_error } = router.query
    if (calendar_connected) {
      setCalendarNotice({ type: 'success', text: `${PROVIDER_LABELS[calendar_connected] || calendar_connected} connected.` })
      router.replace('/tools/scheduling', undefined, { shallow: true })
    } else if (calendar_error) {
      setCalendarNotice({ type: 'error', text: `Could not connect ${PROVIDER_LABELS[calendar_error] || calendar_error}. Please try again.` })
      router.replace('/tools/scheduling', undefined, { shallow: true })
    }
  }, [router.isReady, router.query])

  const loadAll = async () => {
    setLoadingData(true)
    try {
      const [settingsRes, bookingsRes, providersRes, connectionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/settings`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/bookings`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/calendar/providers`, { headers: authHeaders() }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/calendar/connections`, { headers: authHeaders() }),
      ])
      const settingsData = await settingsRes.json()
      const bookingsData = await bookingsRes.json()
      setSettings(settingsData)
      setCalendarProviders(await providersRes.json())
      setCalendarConnections((await connectionsRes.json()).connections || [])

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

  const handleConnectCalendar = async (provider) => {
    setCalendarBusy(provider)
    setCalendarNotice(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/calendar/connect/${provider}`, {
        headers: authHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        setCalendarNotice({ type: 'error', text: data.detail || 'Could not start connecting that calendar.' })
        return
      }
      // A real OAuth consent screen must happen in the top-level browser
      // context (not fetched via XHR), so this is a full page navigation —
      // the provider redirects back to our own callback URL when done.
      window.location.href = data.authorization_url
    } catch (err) {
      setCalendarNotice({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setCalendarBusy(null)
    }
  }

  const handleDisconnectCalendar = async (connectionId) => {
    if (!confirm('Disconnect this calendar? Its busy times will no longer block your booking page.')) return
    setCalendarBusy(connectionId)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scheduling/calendar/connections/${connectionId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      await loadAll()
    } catch (err) {
      console.error('Failed to disconnect calendar:', err)
    } finally {
      setCalendarBusy(null)
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

        {(calendarProviders.google || calendarProviders.microsoft) && (
          <div className="bg-white border border-lightgray p-8 mb-10">
            <h2 className="font-garamond text-xl text-navy mb-2">Connected Calendars</h2>
            <p className="font-inter text-sm text-gray-600 mb-6">
              Sync a calendar so times you're already busy elsewhere never show up as bookable —
              we only read busy/free time, nothing is ever added, edited, or shared from your calendar.
            </p>

            {calendarNotice && (
              <p className={`font-inter text-sm mb-4 ${calendarNotice.type === 'error' ? 'text-error' : 'text-gold'}`}>
                {calendarNotice.text}
              </p>
            )}

            {calendarConnections.length > 0 && (
              <div className="space-y-3 mb-6">
                {calendarConnections.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border border-lightgray px-4 py-3">
                    <div>
                      <p className="font-inter text-sm font-medium text-navy">{PROVIDER_LABELS[c.provider] || c.provider}</p>
                      {c.provider_email && <p className="font-inter text-xs text-gray-500">{c.provider_email}</p>}
                    </div>
                    <button
                      onClick={() => handleDisconnectCalendar(c.id)}
                      disabled={calendarBusy === c.id}
                      className="font-inter text-sm text-error hover:underline disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {calendarProviders.google && !calendarConnections.some((c) => c.provider === 'google') && (
                <button
                  onClick={() => handleConnectCalendar('google')}
                  disabled={calendarBusy === 'google'}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {calendarBusy === 'google' ? 'Connecting...' : '+ Connect Google Calendar'}
                </button>
              )}
              {calendarProviders.microsoft && !calendarConnections.some((c) => c.provider === 'microsoft') && (
                <button
                  onClick={() => handleConnectCalendar('microsoft')}
                  disabled={calendarBusy === 'microsoft'}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  {calendarBusy === 'microsoft' ? 'Connecting...' : '+ Connect Outlook / Microsoft 365'}
                </button>
              )}
            </div>
          </div>
        )}

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
