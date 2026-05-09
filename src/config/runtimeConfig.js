const DEFAULT_API_BASE_URL = 'http://localhost:3000/api'

export const runtimeConfig = Object.freeze({
  apiBaseUrl: getUrlEnv('VITE_API_BASE_URL', DEFAULT_API_BASE_URL),
  realtimeUrl: getOptionalUrlEnv('VITE_REALTIME_URL'),
  enableMockFriends: getBooleanEnv('VITE_ENABLE_MOCK_FRIENDS', true),
  enableMockFriendNotifications: getBooleanEnv(
    'VITE_ENABLE_MOCK_FRIEND_NOTIFICATIONS',
    true,
  ),
})

function getUrlEnv(name, fallback) {
  return String(import.meta.env[name] || fallback).replace(/\/$/, '')
}

function getOptionalUrlEnv(name) {
  const value = import.meta.env[name]

  return value ? String(value).replace(/\/$/, '') : ''
}

function getBooleanEnv(name, fallback) {
  const value = import.meta.env[name]

  if (value === undefined) {
    return fallback
  }

  return value === 'true'
}
