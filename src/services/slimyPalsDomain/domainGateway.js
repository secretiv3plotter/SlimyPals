import { hasAuthSession } from '../authSession'
import { getNetworkStatus } from '../networkStatus'
import { queueFeedFriendSlime } from '../offlineSync'
import {
  deleteMySlime,
  feedFriendSlime as feedFriendSlimeApi,
  feedMySlime,
  produceFood,
  summonSlime,
} from '../slimyPalsApi'
import * as localGateway from './localDomainGateway'
import { saveRemoteDomainToCache, toUiDomain } from './remoteDomainCache'
import { loadRemoteDomain as fetchRemoteDomain } from './remoteDomainGateway'

export { hydrateDomain } from './domainHydration'
export const getMockFriendFeedResult = localGateway.getMockFriendFeedResult
export const loadDomain = localGateway.loadDomain
export const refreshDailyTimers = localGateway.refreshDailyTimers

export {
  feedRemoteFriendSlime,
  feedRemoteOwnedSlime,
  loadRemoteDomain,
  produceRemoteFood,
  removeRemoteOwnedSlime,
  summonRemoteSlime,
} from './remoteDomainGateway'

export async function getFoodProductionAllowed(userId) {
  return runOnlineFirst(
    async () => {
      const domain = await loadRemoteUiDomain()
      return domain?.canProduceFood ?? false
    },
    () => localGateway.getFoodProductionAllowed(userId),
  )
}

export async function summonOwnedSlime(userId) {
  return runOnlineFirst(
    async () => {
      const response = await summonSlime()
      const remoteSlime = getPayload(response).slime
      const domain = await loadRemoteUiDomain()

      return {
        slime: domain.slimes.find((slime) => slime.id === remoteSlime?.id) || remoteSlime,
        user: domain.user,
      }
    },
    () => localGateway.summonOwnedSlime(userId),
  )
}

export async function produceOwnedFood(userId) {
  return runOnlineFirst(
    async () => {
      const response = await produceFood()
      const payload = getPayload(response)
      const domain = await loadRemoteUiDomain()

      return {
        foodFactoryStock: {
          quantity: domain.foodQuantity,
          user_id: userId,
        },
        producedQuantity: payload.producedAmount || payload.producedQuantity || 0,
      }
    },
    () => localGateway.produceOwnedFood(userId),
  )
}

export async function feedOwnedSlime({ slimeId, userId }) {
  return runOnlineFirst(
    async () => {
      const response = await feedMySlime(slimeId)
      const remoteSlime = getPayload(response).slime
      const domain = await loadRemoteUiDomain()

      return {
        foodFactoryStock: {
          quantity: domain.foodQuantity,
          user_id: userId,
        },
        slime: domain.slimes.find((slime) => slime.id === remoteSlime?.id) || remoteSlime,
      }
    },
    () => localGateway.feedOwnedSlime({ slimeId, userId }),
  )
}

export async function removeOwnedSlime({ slimeId, userId }) {
  return runOnlineFirst(
    async () => {
      await deleteMySlime(slimeId)
      return loadRemoteUiDomain()
    },
    () => localGateway.removeOwnedSlime({ slimeId, userId }),
  )
}

export async function feedFriendSlimeOnlineFirst({ friendUserId, slimeId, userId }) {
  return runOnlineFirst(
    async () => {
      const response = await feedFriendSlimeApi({ friendUserId, slimeId })
      const domain = await loadRemoteUiDomain()

      return {
        ...getPayload(response),
        foodFactoryStock: {
          quantity: domain.foodQuantity,
          user_id: userId,
        },
      }
    },
    async () => {
      await queueFeedFriendSlime({ friendUserId, slimeId, userId })
      return null
    },
  )
}

async function loadRemoteUiDomain() {
  const remoteDomain = await fetchRemoteDomain()

  await saveRemoteDomainToCache(remoteDomain)

  return toUiDomain(remoteDomain)
}

async function runOnlineFirst(remoteOperation, localOperation) {
  if (!getNetworkStatus().isOnline || !hasAuthSession()) {
    return localOperation()
  }

  try {
    return await remoteOperation()
  } catch (error) {
    if (error?.code === 'NETWORK_ERROR' || error?.status === 0) {
      return localOperation()
    }

    throw error
  }
}

function getPayload(response) {
  return response?.data || response || {}
}
