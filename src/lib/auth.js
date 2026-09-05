import { useEffect, useState } from 'react'

// Every tool/account page should gate on this instead of hand-rolling a
// localStorage check — a missing user or token now actually redirects to
// /login instead of hanging on a permanent "Loading..." placeholder.
export function useAuthGuard() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userStr || !token) {
      window.location.href = '/login'
      return
    }

    setUser(JSON.parse(userStr))
    setReady(true)
  }, [])

  return { user, ready }
}

// Attach to any fetch that hits an authenticated backend endpoint. The
// backend identifies the caller from this token — it no longer trusts a
// client-supplied user_id, so this header is what actually scopes a
// request to the signed-in account.
export function authHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function logout() {
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  window.location.href = '/login'
}
