import {
  foodFactoryStockRepository,
  getUserDomainSnapshot,
  slimesRepository,
} from '../slimyPalsDb'
import { canFeedSlime, canSummonSlime, getNextFeedAt } from './rules'

export async function getSummonReadiness(userId) {
  // Pseudocode:
  // 1. Load the user's domain snapshot from IndexedDB.
  // 2. Count only active slimes because soft-deleted slimes no longer occupy capacity.
  // 3. Run the pure summon rule against the user and active slime count.
  // 4. Return both the rule result and enough UI data to render a disabled/enabled summon button.
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

export async function getSlimeFeedReadiness(slimeId, userId) {
  // Pseudocode:
  // 1. Load the target slime.
  // 2. Load the owner's food stock, because one food item is consumed per feed.
  // 3. Run the pure feed rule against slime state, food quantity, and current time.
  // 4. Include nextFeedAt so the UI can show a countdown when the 6-hour window is closed.
  const [slime, foodStock] = await Promise.all([
    slimesRepository.getById(slimeId),
    foodFactoryStockRepository.getByUserId(userId),
  ])
  const rule = canFeedSlime({ slime, foodStock })

  return {
    ...rule,
    foodQuantity: foodStock?.quantity ?? 0,
    nextFeedAt: slime ? getNextFeedAt(slime) : null,
    slime,
  }
}
