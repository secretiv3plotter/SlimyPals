import { apiRequest, getJsonOptions } from './client'

export function listFriends() {
  return apiRequest('/me/friends')
}

export function sendFriendRequest(username) {
  return apiRequest('/me/friends', getJsonOptions('POST', { username }))
}

export function acceptFriendRequest(friendshipId) {
  return apiRequest(`/me/friends/${friendshipId}/accept`, getJsonOptions('POST', {}))
}

export function removeFriend(friendshipId) {
  return apiRequest(`/me/friends/${friendshipId}`, getJsonOptions('DELETE'))
}

export function getFriendDomain(friendUserId) {
  return apiRequest(`/friends/${friendUserId}/domain`)
}

export function feedFriendSlime({ friendUserId, slimeId }) {
  return apiRequest(
    `/friends/${friendUserId}/slimes/${slimeId}/feed`,
    getJsonOptions('POST', {}),
  )
}

export function pokeFriendSlime({ friendUserId, slimeId }) {
  return apiRequest(
    `/friends/${friendUserId}/slimes/${slimeId}/poke`,
    getJsonOptions('POST', {}),
  )
}
