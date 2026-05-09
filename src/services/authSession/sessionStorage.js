const AUTH_SESSION_STORAGE_KEY = 'slimy-pals-auth-session'

export function readStoredAuthSession() {
  const storedSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return normalizeAuthSession(JSON.parse(storedSession))
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }
}

export function writeStoredAuthSession(session) {
  const normalizedSession = normalizeAuthSession(session)

  if (!normalizedSession) {
    clearStoredAuthSession()
    return null
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(normalizedSession))

  return normalizedSession
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}

function normalizeAuthSession(session) {
  if (!session?.accessToken || !session?.refreshToken) {
    return null
  }

  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user || null,
  }
}
