export const REALTIME_CONNECTION_STATUSES = Object.freeze({
  CLOSED: 'closed',
  CONNECTING: 'connecting',
  OPEN: 'open',
  RECONNECTING: 'reconnecting',
})

export const CLIENT_REALTIME_EVENTS = Object.freeze({
  PRESENCE_ONLINE: 'presence.online',
  PRESENCE_OFFLINE: 'presence.offline',
  DOMAIN_SUBSCRIBE: 'domain.subscribe',
  DOMAIN_UNSUBSCRIBE: 'domain.unsubscribe',
})

export const SERVER_REALTIME_EVENTS = Object.freeze({
  FRIEND_ONLINE: 'friend.online',
  FRIEND_OFFLINE: 'friend.offline',
  DOMAIN_SLIME_CREATED: 'domain.slime.created',
  DOMAIN_SLIME_UPDATED: 'domain.slime.updated',
  DOMAIN_SLIME_DELETED: 'domain.slime.deleted',
  DOMAIN_FOOD_UPDATED: 'domain.food.updated',
  INTERACTION_CREATED: 'interaction.created',
  NOTIFICATION_CREATED: 'notification.created',
})
