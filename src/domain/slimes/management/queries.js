import {
  foodFactoryStockRepository,
  GAME_LIMITS,
  getUserDomainSnapshot,
  slimesRepository,
} from '../../../infrastructure/db'
import {
  canFeedSlime,
  canProduceSlimeFood,
  canSummonSlime,
  getFoodProductionAmount,
  getNextFeedAt,
} from './rules'

export async function getSummonReadiness(userId) {
  const snapshot = await getUserDomainSnapshot(userId)
  const activeSlimeCount = snapshot.slimes.length
  const rule = canSummonSlime({ user: snapshot.user, activeSlimeCount })

  return {
    ...rule,
    dailySummonsLeft: snapshot.user?.daily_summons_left ?? 0,
    activeSlimeCount,
    maxSlimeCapacity: snapshot.user?.max_slime_capacity ?? 0,
  }
}

export async function getFoodProductionReadiness(userId, options = {}) {
  const now = options.now ?? new Date()
  const snapshot = await getUserDomainSnapshot(userId)
  const activeSlimeCount = snapshot.slimes.length
  const currentFoodQuantity = snapshot.foodFactoryStock?.quantity ?? 0
  const producedQuantity = getFoodProductionAmount(activeSlimeCount, currentFoodQuantity)
  const rule = canProduceSlimeFood({
    user: snapshot.user,
    foodStock: snapshot.foodFactoryStock,
    activeSlimeCount,
    now,
  })

  return {
    ...rule,
    activeSlimeCount,
    currentFoodQuantity,
    maxFoodStock: GAME_LIMITS.MAX_FOOD_STOCK,
    producedQuantity: rule.allowed ? producedQuantity : 0,
    foodFactoryStock: snapshot.foodFactoryStock,
  }
}

export async function getSlimeFeedReadiness(slimeId, userId, options = {}) {
  const [slime, foodStock] = await Promise.all([
    slimesRepository.getById(slimeId),
    foodFactoryStockRepository.getByUserId(userId),
  ])
  const rule = canFeedSlime({
    slime,
    foodStock,
    now: options.now ?? new Date(),
  })

  return {
    ...rule,
    foodQuantity: foodStock?.quantity ?? 0,
    nextFeedAt: slime ? getNextFeedAt(slime) : null,
    slime,
  }
}
