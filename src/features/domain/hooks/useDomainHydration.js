import { useEffect } from 'react'
import { getMsUntilNextLocalMidnight } from '../../../game/dailyTimers'
import { subscribeToNetworkStatus } from '../../../services/networkStatus'
import { hydrateDomain, refreshDailyTimers as refreshDomainDailyTimers } from '../../../services/slimyPalsDomain'

export function useDomainHydration({
  offlineUserId,
  setCanProduceFood,
  setFoodQuantity,
  setOfflineUser,
  setSlimes,
}) {
  useEffect(() => {
    let isCancelled = false

    function runHydration() {
      hydrateDomain({
        onDomain: (domain) => {
          if (!isCancelled) {
            setOfflineUser(domain.user)
            setSlimes(domain.slimes)
            setFoodQuantity(domain.foodQuantity)
            setCanProduceFood(domain.canProduceFood)
          }
        },
        onRemoteError: (error) => console.warn('Unable to hydrate remote domain:', error),
      })
    }

    runHydration()
    const unsubscribe = subscribeToNetworkStatus(({ isOnline }) => {
      if (isOnline) {
        runHydration()
      }
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [setCanProduceFood, setFoodQuantity, setOfflineUser, setSlimes])

  useEffect(() => {
    if (!offlineUserId) {
      return undefined
    }

    let timeoutId = 0
    let isCancelled = false

    async function refreshDailyTimers() {
      try {
        const domain = await refreshDomainDailyTimers(offlineUserId)

        if (!isCancelled) {
          setOfflineUser(domain.user)
          setCanProduceFood(domain.canProduceFood)
          scheduleNextMidnightRefresh()
        }
      } catch (error) {
        console.warn('Unable to refresh daily timers:', error)
        scheduleNextMidnightRefresh()
      }
    }

    function scheduleNextMidnightRefresh() {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(refreshDailyTimers, getMsUntilNextLocalMidnight())
    }
    scheduleNextMidnightRefresh()

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [offlineUserId, setCanProduceFood, setOfflineUser])
}
