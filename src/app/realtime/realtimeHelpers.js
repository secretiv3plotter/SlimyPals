import { getNetworkStatus } from '../../infrastructure/networkStatus'
import { SERVER_REALTIME_EVENTS } from '../../infrastructure/realtime'

export function shouldRefreshFriendMenu(event) {
  return [
    SERVER_REALTIME_EVENTS.FRIEND_LIST_CHANGED,
    SERVER_REALTIME_EVENTS.FRIEND_ONLINE,
    SERVER_REALTIME_EVENTS.FRIEND_OFFLINE,
    SERVER_REALTIME_EVENTS.INITIAL_PRESENCE,
  ].includes(event?.type)
}

export function shouldRefreshFriendYards(event) {
  return [
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED,
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED,
  ].includes(event?.type)
}

export function getRealtimeNotificationMessage(event, currentUserId) {
  if (event?.type === SERVER_REALTIME_EVENTS.FRIEND_ONLINE) {
    const username = event.payload?.username
    return username ? `${username} is online.` : null
  }

  if (event?.type === SERVER_REALTIME_EVENTS.INTERACTION_CREATED) {
    const { actionType, ownerUserId, senderId, senderUsername } = event.payload || {}

    if (ownerUserId === currentUserId && senderId !== currentUserId && senderUsername) {
      return actionType === 'feed'
        ? `${senderUsername} fed one of your slimes.`
        : `${senderUsername} poked one of your slimes.`
    }

    return null
  }

  if (event?.type !== SERVER_REALTIME_EVENTS.FRIEND_LIST_CHANGED) {
    return null
  }

  const { action, receiverId, receiverUsername, senderId, senderUsername } = event.payload || {}

  if (action === 'friend.request.received') {
    if (receiverId === currentUserId && senderUsername) {
      return `${senderUsername} sent you a friend request.`
    }

    if (senderId === currentUserId && receiverUsername) {
      return `Friend request sent to ${receiverUsername}.`
    }
  }

  return null
}

export function getRealtimeEventKey(event) {
  const payload = event?.payload || {}

  if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED && payload.slime?.id) {
    return `${event.type}:${payload.slime.id}`
  }

  if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED && payload.slime?.id) {
    return [
      event.type,
      payload.slime.id,
      payload.slime.level,
      payload.slime.last_fed_at || payload.slime.lastFedAt || '',
    ].join(':')
  }

  if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_DELETED && payload.slimeId) {
    return `${event.type}:${payload.slimeId}`
  }

  if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_FOOD_UPDATED) {
    const foodFactoryStock = payload.foodFactoryStock || payload.factory

    return [
      event.type,
      payload.userId || '',
      foodFactoryStock?.quantity ?? '',
      foodFactoryStock?.last_produced_at || foodFactoryStock?.lastProducedAt || '',
      payload.producedQuantity || '',
    ].join(':')
  }

  if (event?.type === SERVER_REALTIME_EVENTS.INTERACTION_CREATED && payload.slimeId) {
    return [
      event.type,
      payload.actionType,
      payload.senderId,
      payload.slimeId,
      payload.interaction?.id || payload.interaction?.created_at || '',
    ].join(':')
  }

  return null
}

export function addRealtimeNotification({ callback, handledKeysRef, key }) {
  handledKeysRef.current.add(key)
  callback()
  window.setTimeout(() => {
    handledKeysRef.current.delete(key)
  }, 5000)
}

export function addWebsocketNotificationFallback({ callback, handledKeysRef, key, timeoutsRef }) {
  if (!getNetworkStatus().isOnline) {
    callback()
    return
  }

  if (handledKeysRef.current.has(key)) {
    handledKeysRef.current.delete(key)
    return
  }

  clearWebsocketNotificationTimeout(timeoutsRef, key)
  const timeoutId = window.setTimeout(() => {
    timeoutsRef.current.delete(key)
    if (handledKeysRef.current.has(key)) {
      handledKeysRef.current.delete(key)
      return
    }
    callback()
  }, 800)

  timeoutsRef.current.set(key, timeoutId)
}

export function clearWebsocketNotificationTimeout(timeoutsRef, key) {
  const timeoutId = timeoutsRef.current.get(key)
  if (!timeoutId) {
    return
  }

  window.clearTimeout(timeoutId)
  timeoutsRef.current.delete(key)
}
