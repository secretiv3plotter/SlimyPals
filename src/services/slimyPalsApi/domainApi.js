import { apiRequest } from './client'

export function getCurrentUser() {
  return apiRequest('/me')
}

export function getMyDomain() {
  return apiRequest('/me/domain')
}

export function getTimers() {
  return apiRequest('/me/timers')
}

export function healthCheck() {
  return apiRequest('/health')
}
