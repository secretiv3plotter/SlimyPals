import { apiRequest, getJsonOptions } from './client'

export function listNotifications(limit = 20) {
  return apiRequest(`/me/notifications?limit=${encodeURIComponent(limit)}`)
}

export function markNotificationRead(notificationId) {
  return apiRequest(
    `/me/notifications/${notificationId}/read`,
    getJsonOptions('POST', {}),
  )
}
