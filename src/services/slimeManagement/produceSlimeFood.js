import {
  foodFactoryStockRepository,
  slimesRepository,
  STORES,
  usersRepository,
  withTransaction,
} from '../slimyPalsDb'
import { assertRule } from './slimeManagementError'
import { canProduceSlimeFood, getFoodProductionAmount } from './rules'

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
