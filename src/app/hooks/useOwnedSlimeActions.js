import audioManager from '../../audio/audioManager'
import { SOUND_KEYS } from '../../audio/soundFiles'
import { getSlimeDisplayName } from '../../domain/slimes/slimeText'
import {
  feedOwnedSlime,
  removeOwnedSlime,
  summonOwnedSlime,
} from '../../infrastructure/domainGateway'
import { SLIME_RARITIES } from '../../infrastructure/db/constants'
import { addWebsocketNotificationFallback } from '../realtime/realtimeHelpers'

const SUMMON_RARITY_SOUND_KEYS = Object.freeze({
  [SLIME_RARITIES.RARE]: {
    baseball: SOUND_KEYS.RARE_BASEBALL,
    beanie: SOUND_KEYS.RARE_BEANIE,
    fedora: SOUND_KEYS.RARE_FEDORA,
  },
  [SLIME_RARITIES.MYTHICAL]: {
    demon: SOUND_KEYS.MYTHICAL_DEMON,
    king: SOUND_KEYS.MYTHICAL_KING,
    witch: SOUND_KEYS.MYTHICAL_WITCH,
  },
})

export function useOwnedSlimeActions({
  addNotification,
  canSummonFromGround,
  foodQuantity,
  offlineUser,
  pendingLocalDeleteSlimeIdsRef,
  pendingLocalFeedSlimeIdsRef,
  pendingLocalSummonCountRef,
  realtimeHandledDeleteSlimeIdsRef,
  realtimeNotificationKeysRef,
  refreshFoodProductionReadiness,
  setDyingSlimeIds,
  setFoodQuantity,
  setOfflineUser,
  setPendingDeleteSlime,
  setSlimes,
  setSummoningOrbAnimationRun,
  slimes,
  triggerAppearingSlime,
  websocketNotificationTimeoutsRef,
}) {
  function notifyActionFailure(message, error) {
    console.warn(message, error)
    addNotification(message)
  }

  async function handleSummonSlime(event) {
    event.stopPropagation()

    if (!offlineUser) {
      return
    }

    if (!canSummonFromGround) {
      addNotification("You've used all your summons for today!")
      return
    }

    audioManager.playSfx(SOUND_KEYS.SUMMON_2)
    setSummoningOrbAnimationRun((run) => run + 1)
    pendingLocalSummonCountRef.current += 1
    window.setTimeout(() => {
      pendingLocalSummonCountRef.current = Math.max(0, pendingLocalSummonCountRef.current - 1)
    }, 5000)

    try {
      const { slime, user } = await summonOwnedSlime(offlineUser.id)
      const raritySoundKey = getSummonRaritySoundKey(slime)

      setOfflineUser(user)
      setSlimes((currentSlimes) => (
        currentSlimes.some((currentSlime) => currentSlime.id === slime.id)
          ? currentSlimes
          : [...currentSlimes, slime]
      ))
      if (raritySoundKey) {
        audioManager.playSfx(raritySoundKey)
      }
      triggerAppearingSlime(slime.id)
      addWebsocketNotificationFallback({
        callback: () => addNotification(`You summoned a ${getSlimeDisplayName(slime)} slime.`),
        handledKeysRef: realtimeNotificationKeysRef,
        key: `summon:${slime.id}`,
        timeoutsRef: websocketNotificationTimeoutsRef,
      })
      await refreshFoodProductionReadiness(user.id)
    } catch (error) {
      pendingLocalSummonCountRef.current = Math.max(0, pendingLocalSummonCountRef.current - 1)
      notifyActionFailure('Unable to summon slime.', error)
    }
  }

  async function handleFeedSlime(slimeId) {
    if (!offlineUser || foodQuantity <= 0) {
      addNotification('No slime food available.')
      return
    }

    const previousSlime = slimes.find((currentSlime) => currentSlime.id === slimeId)
    pendingLocalFeedSlimeIdsRef.current.add(slimeId)
    window.setTimeout(() => {
      pendingLocalFeedSlimeIdsRef.current.delete(slimeId)
    }, 5000)

    try {
      const { foodFactoryStock, slime } = await feedOwnedSlime({
        slimeId,
        userId: offlineUser.id,
      })
      audioManager.playSfx(SOUND_KEYS.EATING)

      setFoodQuantity(foodFactoryStock.quantity)
      setSlimes((currentSlimes) => (
        currentSlimes.map((currentSlime) => (
          currentSlime.id === slime.id ? slime : currentSlime
        ))
      ))
      if (previousSlime && slime.level > previousSlime.level) {
        audioManager.playSfx(SOUND_KEYS.LEVEL_UP)
      }
      addWebsocketNotificationFallback({
        callback: () => addNotification(`Your ${getSlimeDisplayName(slime)} slime has leveled up!`),
        handledKeysRef: realtimeNotificationKeysRef,
        key: `feed:${slime.id}`,
        timeoutsRef: websocketNotificationTimeoutsRef,
      })
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      pendingLocalFeedSlimeIdsRef.current.delete(slimeId)
      notifyActionFailure(error.message || 'Unable to feed slime.', error)
    }
  }

  async function handleRemoveSlime(slimeId) {
    if (!offlineUser) {
      return
    }

    setPendingDeleteSlime(null)
    pendingLocalDeleteSlimeIdsRef.current.add(slimeId)
    window.setTimeout(() => {
      pendingLocalDeleteSlimeIdsRef.current.delete(slimeId)
    }, 5000)

    try {
      await removeOwnedSlime({ slimeId, userId: offlineUser.id })
      if (realtimeHandledDeleteSlimeIdsRef.current.has(slimeId)) {
        realtimeHandledDeleteSlimeIdsRef.current.delete(slimeId)
      } else {
        pendingLocalDeleteSlimeIdsRef.current.delete(slimeId)
        setDyingSlimeIds((currentIds) => (
          currentIds.includes(slimeId) ? currentIds : [...currentIds, slimeId]
        ))
        audioManager.playSfx(SOUND_KEYS.KILL)
        addWebsocketNotificationFallback({
          callback: () => addNotification('One of your slimes disappeared.'),
          handledKeysRef: realtimeNotificationKeysRef,
          key: `delete:${slimeId}`,
          timeoutsRef: websocketNotificationTimeoutsRef,
        })
      }
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      pendingLocalDeleteSlimeIdsRef.current.delete(slimeId)
      realtimeHandledDeleteSlimeIdsRef.current.delete(slimeId)
      notifyActionFailure('Unable to remove slime.', error)
    }
  }

  return {
    handleFeedSlime,
    handleRemoveSlime,
    handleSummonSlime,
  }
}

export function getSummonRaritySoundKey(slime) {
  return SUMMON_RARITY_SOUND_KEYS[slime.rarity]?.[slime.type]
}
