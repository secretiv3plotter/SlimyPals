import { useEffect, useState } from 'react'
import { getAuthSession, subscribeAuthSession } from '../services/authSession'

export function useAuthSession() {
  const [authSession, setAuthSession] = useState(() => getAuthSession())

  useEffect(() => subscribeAuthSession(setAuthSession), [])

  return {
    authSession,
    isAuthenticated: Boolean(authSession?.accessToken),
    user: authSession?.user || null,
  }
}
