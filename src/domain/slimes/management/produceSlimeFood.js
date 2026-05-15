import {
  foodFactoryStockRepository,
  slimesRepository,
  STORES,
  usersRepository,
  withTransaction,
} from '../../../infrastructure/db'
import { assertRule } from './slimeManagementError'
import { canProduceSlimeFood, getFoodProductionAmount } from './rules'

export async function produceSlimeFood(userId, options = {}) {
  return withTransaction([STORES.FOOD_FACTORY_STOCK, STORES.SLIME, STORES.USER], 'rw', async () => {
    const now = options.now ?? new Date()
    const nowIso = now.toISOString()
    const [user, activeSlimes, existingStock] = await Promise.all([
      usersRepository.getById(userId),
      slimesRepository.listByUserId(userId),
      foodFactoryStockRepository.getByUserId(userId),
    ])
    const activeSlimeCount = activeSlimes.length
    const rule = canProduceSlimeFood({
      user,
      foodStock: existingStock,
      activeSlimeCount,
      now,
    })

    assertRule(rule)

    const currentFoodQuantity = existingStock?.quantity ?? 0
    const producedQuantity = getFoodProductionAmount(activeSlimeCount, currentFoodQuantity)

    if (existingStock) {
      const foodFactoryStock = await foodFactoryStockRepository.update(existingStock.id, {
        quantity: currentFoodQuantity + producedQuantity,
        last_produced_at: nowIso,
      })

      return { foodFactoryStock, producedQuantity }
    }

    const foodFactoryStock = await foodFactoryStockRepository.create({
      user_id: userId,
      quantity: producedQuantity,
      last_produced_at: nowIso,
    })

    return { foodFactoryStock, producedQuantity }
  })
}
