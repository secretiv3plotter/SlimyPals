import {
  foodFactoryStockRepository,
  GAME_LIMITS,
  interactionLogsRepository,
  INTERACTION_TYPES,
  slimesRepository,
  STORES,
  usersRepository,
  withTransaction,
} from '../slimyPalsDb'
import { assertRule } from './slimeManagementError'
import {
  canFeedSlime,
  canProduceSlimeFood,
  canSummonSlime,
  createInteractionLogDraft,
  createSummonedSlimeDraft,
  getFoodProductionAmount,
  getNextSlimeLevel,
} from './rules'

export async function summonSlime(userId, options = {}) {
  // Pseudocode:
  // 1. Load the user record by userId.
  // 2. Load all active slimes owned by the user.
  // 3. Check summoning rules:
  //    - user must exist and not be soft-deleted.
  //    - daily_summons_left must be greater than 0.
  //    - active slime count must be below max_slime_capacity.
  // 4. Roll a rarity from the configured weighted summon table.
  // 5. Pick one of the three slime types for that rarity.
  // 6. Create a level 1 baby slime in IndexedDB.
  // 7. Decrement daily_summons_left by 1.
  // 8. Return the created slime and updated user state for the UI.
  return withTransaction([STORES.USER, STORES.SLIME], 'rw', async () => {
    const user = await usersRepository.getById(userId)
    const activeSlimes = await slimesRepository.listByUserId(userId)
    const rule = canSummonSlime({ user, activeSlimeCount: activeSlimes.length })

    assertRule(rule)

    const slimeDraft = createSummonedSlimeDraft({
      userId,
      random: options.random,
      now: options.now,
    })
    const slime = await slimesRepository.create(slimeDraft)
    const updatedUser = await usersRepository.update(userId, {
      daily_summons_left: user.daily_summons_left - 1,
    })

    return { slime, user: updatedUser }
  })
}

export async function produceSlimeFood(userId, options = {}) {
  // Pseudocode:
  // 1. Load the user, active slimes, and existing food stock.
  // 2. Check food production rules:
  //    - user must exist and not be soft-deleted.
  //    - at least one active slime must exist.
  //    - factory must not have produced already today.
  //    - food stock must be below max capacity.
  // 3. Production amount equals the current active slime count, capped by remaining food stock space.
  // 4. If the stock row exists:
  //    - add produced food to the current stack.
  //    - update last_produced_at.
  // 5. If the stock row does not exist:
  //    - create it with quantity equal to produced food.
  // 6. Return the updated stock and produced amount.
  return withTransaction([STORES.FOOD_FACTORY_STOCK, STORES.SLIME, STORES.USER], 'rw', async () => {
    const now = options.now ?? new Date()
    const [user, activeSlimes, existingStock] = await Promise.all([
      usersRepository.getById(userId),
      slimesRepository.listByUserId(userId),
      foodFactoryStockRepository.getByUserId(userId),
    ])
    const rule = canProduceSlimeFood({
      user,
      foodStock: existingStock,
      activeSlimeCount: activeSlimes.length,
      now,
    })

    assertRule(rule)

    const currentFoodQuantity = existingStock?.quantity ?? 0
    const producedQuantity = getFoodProductionAmount(activeSlimes.length, currentFoodQuantity)

    if (existingStock) {
      const foodFactoryStock = await foodFactoryStockRepository.update(existingStock.id, {
        quantity: currentFoodQuantity + producedQuantity,
        last_produced_at: now.toISOString(),
      })

      return { foodFactoryStock, producedQuantity }
    }

    const foodFactoryStock = await foodFactoryStockRepository.create({
      user_id: userId,
      quantity: producedQuantity,
      last_produced_at: now.toISOString(),
    })

    return { foodFactoryStock, producedQuantity }
  })
}

export async function resetDailySummons(userId) {
  // Pseudocode:
  // 1. Run this from the future daily reset workflow or from app startup reconciliation.
  // 2. Load the user record.
  // 3. If the user is missing or soft-deleted, do not mutate game state.
  // 4. Restore daily_summons_left to the configured daily limit of 9.
  // 5. Return the updated user so the UI can refresh summon counters.
  const user = await usersRepository.getById(userId)

  if (!user || user.deleted_at) {
    assertRule({
      allowed: false,
      reason: 'USER_UNAVAILABLE',
      message: 'Daily summons can only be reset for an active user.',
    })
  }

  return usersRepository.update(userId, {
    daily_summons_left: GAME_LIMITS.DAILY_SUMMONS,
  })
}

export async function feedSlime({ slimeId, ownerUserId, feederUserId = ownerUserId, options = {} }) {
  // Pseudocode:
  // 1. Load the target slime.
  // 2. Load the owner's food stock because food belongs to the slime owner domain.
  // 3. Check feeding rules:
  //    - slime must exist and not be soft-deleted.
  //    - slime must be below adult level.
  //    - food quantity must be at least 1.
  //    - slime must be outside the 6-hour cooldown window.
  // 4. Consume exactly one slime food from the owner's stock.
  // 5. Increase slime level by one, capped at adult.
  // 6. Set last_fed_at to the current timestamp.
  // 7. Write an interaction log so friend feeds and owner feeds share one history trail.
  // 8. Return the updated slime, updated stock, and interaction log.
  return withTransaction(
    [STORES.FOOD_FACTORY_STOCK, STORES.INTERACTION_LOG, STORES.SLIME],
    'rw',
    async () => {
      const now = options.now ?? new Date()
      const [slime, foodStock] = await Promise.all([
        slimesRepository.getById(slimeId),
        foodFactoryStockRepository.getByUserId(ownerUserId),
      ])
      const rule = canFeedSlime({ slime, foodStock, now })

      assertRule(rule)

      const updatedFoodStock = await foodFactoryStockRepository.update(foodStock.id, {
        quantity: foodStock.quantity - 1,
      })
      const updatedSlime = await slimesRepository.update(slimeId, {
        level: getNextSlimeLevel(slime.level),
        last_fed_at: now.toISOString(),
      })
      const interactionLog = await interactionLogsRepository.create(
        createInteractionLogDraft({
          senderId: feederUserId,
          targetSlimeId: slimeId,
          actionType: INTERACTION_TYPES.FEED,
          now,
        }),
      )

      return {
        slime: updatedSlime,
        foodFactoryStock: updatedFoodStock,
        interactionLog,
      }
    },
  )
}

export async function pokeSlime({ slimeId, senderId, options = {} }) {
  // Pseudocode:
  // 1. Load the target slime to ensure the interaction points at an active slime.
  // 2. If the slime is missing or soft-deleted, fail before logging anything.
  // 3. Create an interaction log with action_type "poke".
  // 4. Return the log; the UI can use it to animate bounce/color contrast locally.
  return withTransaction([STORES.INTERACTION_LOG, STORES.SLIME], 'rw', async () => {
    const now = options.now ?? new Date()
    const slime = await slimesRepository.getById(slimeId)

    if (!slime || slime.deleted_at) {
      assertRule({
        allowed: false,
        reason: 'SLIME_UNAVAILABLE',
        message: 'Only an active slime can be poked.',
      })
    }

    const interactionLog = await interactionLogsRepository.create(
      createInteractionLogDraft({
        senderId,
        targetSlimeId: slimeId,
        actionType: INTERACTION_TYPES.POKE,
        now,
      }),
    )

    return { slime, interactionLog }
  })
}
