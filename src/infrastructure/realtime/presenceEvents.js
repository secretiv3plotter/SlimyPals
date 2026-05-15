import {
  CLIENT_REALTIME_EVENTS,
  SERVER_REALTIME_EVENTS,
} from './realtimeEvents'

export function createPresenceOnlineEvent() {
  return {
    type: CLIENT_REALTIME_EVENTS.PRESENCE_ONLINE,
    payload: {},
  }
}

export function createPresenceOfflineEvent() {
  return {
    type: CLIENT_REALTIME_EVENTS.PRESENCE_OFFLINE,
    payload: {},
  }
}

export function isPresenceEvent(event) {
  return [
    SERVER_REALTIME_EVENTS.FRIEND_ONLINE,
    SERVER_REALTIME_EVENTS.FRIEND_OFFLINE,
  ].includes(event?.type)
}

export function getPresenceFriend(event) {
  return event?.payload?.friend || event?.payload || null
}
