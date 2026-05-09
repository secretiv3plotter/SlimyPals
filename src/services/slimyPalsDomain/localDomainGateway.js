import {
  isSameLocalDay,
  resetDailySummonsForToday,
} from '../../game/dailyTimers'
import { getOrCreateOfflineUser } from '../../game/offlineUser'
import {
  feedSlime,
  getFoodProductionReadiness,
  produceSlimeFood,
  removeSlime,
  summonSlime,
} from '../slimeManagement'
import {
  foodFactoryStockRepository,
  slimesRepository,
} from '../slimyPalsDb'
import {
  queueDeleteOwnSlime,
  queueFeedOwnSlime,
  queueProduceFood,
  queueSummonSlime,
} from '../offlineSync'

export async function loadDomain() {
  const loadedUser = await getOrCreateOfflineUser()
  const user = isSameLocalDay(loadedUser.last_login)
    ? loadedUser
    : await resetDailySummonsForToday(loadedUser.id)
  const [slimes, foodFactoryStock, canProduceFood] = await Promise.all([
    slimesRepository.listByUserId(user.id),
    foodFactoryStockRepository.getByUserId(user.id),
    getFoodProductionAllowed(user.id),
  ])

  return {
    canProduceFood,
    foodQuantity: foodFactoryStock?.quantity ?? 0,
    slimes,
    user,
  }
}

export async function refreshDailyTimers(userId) {
  const user = await resetDailySummonsForToday(userId)
  const canProduceFood = await getFoodProductionAllowed(user.id)

  return { canProduceFood, user }
}

export async function getFoodProductionAllowed(userId) {
  const readiness = await getFoodProductionReadiness(userId)

  return readiness.allowed
}

export async function summonOwnedSlime(userId) {
  const result = await summonSlime(userId)
  await queueSafely(() => queueSummonSlime({ slimeId: result.slime.id, userId }))

  return result
}

export async function produceOwnedFood(userId) {
  const result = await produceSlimeFood(userId)
  await queueSafely(() => queueProduceFood({
    producedQuantity: result.producedQuantity,
    userId,
  }))

  return result
}

export async function feedOwnedSlime({ slimeId, userId }) {
  const result = await feedSlime({
    ownerUserId: userId,
    slimeId,
  })
  await queueSafely(() => queueFeedOwnSlime({ slimeId, userId }))

  return result
}

export async function removeOwnedSlime({ slimeId, userId }) {
  const result = await removeSlime({ slimeId, userId })
  await queueSafely(() => queueDeleteOwnSlime({ slimeId, userId }))

  return result
}

export function getMockFriendFeedResult({ foodQuantity, slimeLevel }) {
  if (foodQuantity <= 0) {
    return { allowed: false, reason: 'NO_FOOD_AVAILABLE' }
  }

  if (slimeLevel >= 3) {
    return { allowed: false, reason: 'SLIME_ALREADY_ADULT' }
  }

  return { allowed: true, reason: null }
}

async function queueSafely(queueOperation) {
  try {
    return await queueOperation()
  } catch (error) {
    console.warn('Unable to queue offline action:', error)
    return null
  }
}
