import {
  foodFactoryStockRepository,
  GAME_LIMITS,
  interactionLogsRepository,
  INTERACTION_TYPES,
  slimesRepository,
  STORES,
  usersRepository,
  withTransaction,
} from '../../../infrastructure/db'
import { assertRule } from './slimeManagementError'
import {
  canFeedSlime,
  canProduceSlimeFood,
  canRemoveSlime,
  canSummonSlime,
  createInteractionLogDraft,
  createSummonedSlimeDraft,
  getFoodProductionAmount,
  getNextSlimeLevel,
} from './rules'

export async function summonSlime(userId, options = {}) {
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

export async function removeSlime({ slimeId, userId }) {
  return withTransaction(STORES.SLIME, 'rw', async () => {
    const slime = await slimesRepository.getById(slimeId)
    const rule = canRemoveSlime({ slime, userId })

    assertRule(rule)

    return slimesRepository.softDelete(slimeId)
  })
}

export async function pokeSlime({ slimeId, senderId, options = {} }) {
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
