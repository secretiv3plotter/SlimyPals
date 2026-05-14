import {
  clearAccessToken,
  getCurrentUser,
  login,
  logout,
  refreshToken as refreshApiToken,
  register,
  setAccessToken,
} from '../slimyPalsApi'
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  writeStoredAuthSession,
} from './sessionStorage'

let currentSession = readStoredAuthSession()
const authSessionListeners = new Set()

applyAccessToken(currentSession)

export function getAuthSession() {
  return currentSession
}

export function hasAuthSession() {
  return Boolean(currentSession?.accessToken)
}

export function getAuthenticatedUser() {
  return currentSession?.user || null
}

export async function registerAuthSession(credentials) {
  return saveAuthResponse(await register(credentials))
}

export async function loginAuthSession(credentials) {
  return saveAuthResponse(await login(credentials))
}

export async function refreshAuthSession() {
  if (!currentSession?.refreshToken) {
    return null
  }

  return saveAuthResponse({
    ...(await refreshApiToken(currentSession.refreshToken)),
    user: currentSession.user,
  })
}

export async function loadAuthenticatedUser() {
  if (!hasAuthSession()) {
    return null
  }

  const response = await getCurrentUser()
  currentSession = writeStoredAuthSession({
    ...currentSession,
    user: response.user,
  })
  notifyAuthSessionListeners()

  return currentSession.user
}

export async function logoutAuthSession() {
  const refreshToken = currentSession?.refreshToken

  clearAuthSession()

  if (refreshToken) {
    await logout(refreshToken).catch((error) => {
      console.warn('Unable to logout through API:', error)
    })
  }
}

export function clearAuthSession() {
  currentSession = null
  clearAccessToken()
  clearStoredAuthSession()
  notifyAuthSessionListeners()
}

export function subscribeAuthSession(listener) {
  authSessionListeners.add(listener)
  listener(currentSession)

  return () => authSessionListeners.delete(listener)
}

function saveAuthResponse(response) {
  currentSession = writeStoredAuthSession(getAuthResponsePayload(response))
  applyAccessToken(currentSession)
  notifyAuthSessionListeners()

  return currentSession
}

function getAuthResponsePayload(response) {
  return response?.data || response
}

function applyAccessToken(session) {
  if (session?.accessToken) {
    setAccessToken(session.accessToken)
  } else {
    clearAccessToken()
  }
}

function notifyAuthSessionListeners() {
  authSessionListeners.forEach((listener) => listener(currentSession))
}
