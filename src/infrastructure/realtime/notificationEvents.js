import { SERVER_REALTIME_EVENTS } from './realtimeEvents'

export function isNotificationEvent(event) {
  return event?.type === SERVER_REALTIME_EVENTS.NOTIFICATION_CREATED
    || event?.payload?.notification
}

export function getRealtimeNotification(event) {
  return event?.payload?.notification || null
}

export function getRealtimeNotificationMessage(event) {
  return getRealtimeNotification(event)?.message || event?.payload?.message || null
}
