import { cacheDomainEvent, isDomainEvent } from './domainEvents'
import { getRealtimeNotificationMessage, isNotificationEvent } from './notificationEvents'
import { getPresenceFriend, isPresenceEvent } from './presenceEvents'

export function createRealtimeEventRouter({ onFriendPresence, onNotification } = {}) {
  return async function routeRealtimeEvent(event) {
    if (isPresenceEvent(event)) {
      onFriendPresence?.({
        event,
        friend: getPresenceFriend(event),
      })
      return
    }

    if (isNotificationEvent(event)) {
      onNotification?.({
        event,
        message: getRealtimeNotificationMessage(event),
      })
      return
    }

    if (isDomainEvent(event)) {
      await cacheDomainEvent(event)
    }
  }
}
