import { createDomainSubscribeEvent, createDomainUnsubscribeEvent } from './domainEvents'
import { createPresenceOfflineEvent, createPresenceOnlineEvent } from './presenceEvents'

export function announcePresenceOnline(client) {
  const event = createPresenceOnlineEvent()

  return client.send(event.type, event.payload)
}

export function announcePresenceOffline(client) {
  const event = createPresenceOfflineEvent()

  return client.send(event.type, event.payload)
}

export function subscribeToFriendDomain(client, friendUserId) {
  const event = createDomainSubscribeEvent(friendUserId)

  return client.send(event.type, event.payload)
}

export function unsubscribeFromFriendDomain(client, friendUserId) {
  const event = createDomainUnsubscribeEvent(friendUserId)

  return client.send(event.type, event.payload)
}
