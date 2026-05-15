import audioManager from '../../audio/audioManager'
import { SOUND_KEYS } from '../../audio/soundFiles'
import {
  getFoodProductionAllowed,
  produceOwnedFood,
} from '../../infrastructure/domainGateway'
import { GAME_LIMITS } from '../../infrastructure/db/constants'
import { addWebsocketNotificationFallback } from '../realtime/realtimeHelpers'

export function useFoodFactoryActions({
  addNotification,
  canProduceFood,
  foodFactoryAnimationRun,
  foodQuantity,
  offlineUser,
  pendingLocalFoodProductionCountRef,
  realtimeNotificationKeysRef,
  setCanProduceFood,
  setFoodFactoryAnimationRun,
  setFoodQuantity,
  slimes,
  websocketNotificationTimeoutsRef,
}) {
  async function refreshFoodProductionReadiness(userId = offlineUser?.id) {
    if (!userId) {
      setCanProduceFood(false)
      return
    }

    try {
      setCanProduceFood(await getFoodProductionAllowed(userId))
    } catch (error) {
      console.warn('Unable to check food factory readiness:', error)
      setCanProduceFood(false)
    }
  }

  function notifyActionFailure(message, error) {
    console.warn(message, error)
    addNotification(message)
  }

  async function handleFoodFactoryClick(event) {
    event.stopPropagation()

    if (!offlineUser || foodFactoryAnimationRun > 0) {
      return
    }

    if (slimes.length === 0) {
      addNotification('Summon a slime first to produce food!')
      return
    }

    if (foodQuantity >= GAME_LIMITS.MAX_FOOD_STOCK) {
      addNotification('Greedy! You have more than enough food.')
      return
    }

    if (!canProduceFood) {
      addNotification('Your factory is out of resources. Try again tomorrow.')
      return
    }

    audioManager.playSfx(SOUND_KEYS.FACTORY)
    setFoodFactoryAnimationRun((run) => run + 1)
    pendingLocalFoodProductionCountRef.current += 1
    window.setTimeout(() => {
      pendingLocalFoodProductionCountRef.current = Math.max(
        0,
        pendingLocalFoodProductionCountRef.current - 1,
      )
    }, 5000)

    try {
      const { foodFactoryStock, producedQuantity } = await produceOwnedFood(offlineUser.id)

      setFoodQuantity(foodFactoryStock.quantity)
      addWebsocketNotificationFallback({
        callback: () => addNotification(`Your factory produced ${producedQuantity} food.`),
        handledKeysRef: realtimeNotificationKeysRef,
        key: 'food-production',
        timeoutsRef: websocketNotificationTimeoutsRef,
      })
    } catch (error) {
      pendingLocalFoodProductionCountRef.current = Math.max(
        0,
        pendingLocalFoodProductionCountRef.current - 1,
      )
      notifyActionFailure('Unable to produce slime food.', error)
      await refreshFoodProductionReadiness(offlineUser.id)
    }
  }

  async function handleFoodFactoryAnimationEnd() {
    setFoodFactoryAnimationRun(0)
    await refreshFoodProductionReadiness()
  }

  return {
    handleFoodFactoryAnimationEnd,
    handleFoodFactoryClick,
    refreshFoodProductionReadiness,
  }
}
