import { hasAuthSession } from '../authSession'
import { getNetworkStatus } from '../networkStatus'
import { queueFeedFriendSlime } from '../offlineSync'
import {
  deleteMySlime,
  feedFriendSlime as feedFriendSlimeApi,
  feedMySlime,
  getTimers,
  produceFood,
  summonSlime,
} from '../slimyPalsApi'
import * as localGateway from './localDomainGateway'

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
      const response = await getTimers()
      const payload = getPayload(response)

      return payload.foodProductionReadiness?.allowed ?? false
    },
    () => localGateway.getFoodProductionAllowed(userId),
  )
}

export async function summonOwnedSlime(userId) {
  return runOnlineFirst(
    async () => {
      const response = await summonSlime()
      const payload = getPayload(response)

      return {
        slime: payload.slime,
        user: payload.user,
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

      return {
        foodFactoryStock: payload.factory || payload.foodFactoryStock,
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
      const payload = getPayload(response)

      return {
        foodFactoryStock: payload.factory || payload.foodFactoryStock,
        slime: payload.slime,
      }
    },
    () => localGateway.feedOwnedSlime({ slimeId, userId }),
  )
}

export async function removeOwnedSlime({ slimeId, userId }) {
  return runOnlineFirst(
    async () => {
      await deleteMySlime(slimeId)
      return { slimeId }
    },
    () => localGateway.removeOwnedSlime({ slimeId, userId }),
  )
}

export async function feedFriendSlimeOnlineFirst({ friendUserId, slimeId, userId }) {
  return runOnlineFirst(
    async () => {
      const response = await feedFriendSlimeApi({ friendUserId, slimeId })
      const payload = getPayload(response)

      return {
        ...payload,
        foodFactoryStock: payload.factory || payload.foodFactoryStock,
      }
    },
    async () => {
      await queueFeedFriendSlime({ friendUserId, slimeId, userId })
      return null
    },
  )
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
