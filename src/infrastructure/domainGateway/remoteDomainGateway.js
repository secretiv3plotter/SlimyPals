import {
  deleteMySlime,
  feedFriendSlime,
  feedMySlime,
  getMyDomain,
  produceFood,
  summonSlime,
} from '../api'

export async function loadRemoteDomain() {
  return getMyDomain()
}

export function summonRemoteSlime() {
  return summonSlime()
}

export function produceRemoteFood() {
  return produceFood()
}

export function feedRemoteOwnedSlime(slimeId) {
  return feedMySlime(slimeId)
}

export function feedRemoteFriendSlime({ friendUserId, slimeId }) {
  return feedFriendSlime({ friendUserId, slimeId })
}

export function removeRemoteOwnedSlime(slimeId) {
  return deleteMySlime(slimeId)
}
