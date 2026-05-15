import { useCallback, useEffect, useState } from 'react'
import audioManager from '../../audio/audioManager'
import { SOUND_KEYS } from '../../audio/soundFiles'
import { getFriendDomain } from '../../infrastructure/api'
import {
  feedFriendSlimeOnlineFirst,
  getMockFriendFeedResult,
  pokeFriendSlimeOnlineFirst,
} from '../../infrastructure/domainGateway'
import { SERVER_REALTIME_EVENTS } from '../../infrastructure/realtime'

export function useFriendYards({
  addNotification,
  foodQuantity,
  friendMenuFriends,
  isAuthenticated,
  offlineUser,
  setFoodQuantity,
}) {
  const [friendYards, setFriendYards] = useState([])
  const [friendYardRefreshRun, setFriendYardRefreshRun] = useState(0)
  const [friendAppearingSlimeIds, setFriendAppearingSlimeIds] = useState([])
  const [friendDyingSlimeIds, setFriendDyingSlimeIds] = useState([])

  const requestFriendYardRefresh = useCallback(() => {
    setFriendYardRefreshRun((run) => run + 1)
  }, [])

  const removeOfflineFriendYard = useCallback((userId) => {
    setFriendYards((currentYards) => (
      currentYards.filter((yard) => yard.id !== userId)
    ))
  }, [])

  const triggerFriendAppearingSlime = useCallback((slimeId) => {
    if (!slimeId) {
      return
    }

    setFriendAppearingSlimeIds((currentIds) => [...currentIds, slimeId])
    window.setTimeout(() => {
      setFriendAppearingSlimeIds((currentIds) => (
        currentIds.filter((currentId) => currentId !== slimeId)
      ))
    }, 1000)
  }, [])

  const handleRealtimeFriendYardEvent = useCallback((event) => {
    const { slime, slimeId, userId } = event.payload || {}

    if (event.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED) {
      if (!slime) {
        requestFriendYardRefresh()
        return
      }

      setFriendYards((currentYards) => currentYards.map((yard) => (
        yard.id === userId
          ? {
            ...yard,
            slimes: yard.slimes.some((currentSlime) => currentSlime.id === slime.id)
              ? yard.slimes
              : [...yard.slimes, slime],
          }
          : yard
      )))
      triggerFriendAppearingSlime(slime.id)
      return
    }

    if (event.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED) {
      if (!slime) {
        requestFriendYardRefresh()
        return
      }

      setFriendYards((currentYards) => currentYards.map((yard) => (
        yard.id === userId
          ? {
            ...yard,
            slimes: yard.slimes.map((currentSlime) => (
              currentSlime.id === slime.id ? slime : currentSlime
            )),
          }
          : yard
      )))
      return
    }

    if (event.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_DELETED && slimeId) {
      setFriendDyingSlimeIds((currentIds) => (
        currentIds.includes(slimeId) ? currentIds : [...currentIds, slimeId]
      ))
      audioManager.playSfx(SOUND_KEYS.KILL)
    }
  }, [requestFriendYardRefresh, triggerFriendAppearingSlime])

  useEffect(() => {
    let isDisposed = false
    const onlineFriends = isAuthenticated
      ? friendMenuFriends.filter((friend) => friend.online).slice(0, 4)
      : []

    async function loadFriendYards() {
      await Promise.resolve()

      const loadedYards = onlineFriends.length === 0
        ? []
        : await Promise.all(onlineFriends.map(async (friend) => {
          try {
            const response = await getFriendDomain(friend.id)
            const payload = response?.data || response || {}

            return {
              id: friend.id,
              username: friend.username,
              slimes: payload.slimes || [],
            }
          } catch (error) {
            console.warn(`Unable to load ${friend.username}'s yard:`, error)
            return {
              id: friend.id,
              username: friend.username,
              slimes: [],
            }
          }
        }))

      if (!isDisposed) {
        setFriendYards(loadedYards)
      }
    }

    loadFriendYards()

    return () => {
      isDisposed = true
    }
  }, [friendMenuFriends, friendYardRefreshRun, isAuthenticated])

  function notifyActionFailure(message, error) {
    console.warn(message, error)
    addNotification(message)
  }

  async function handleFeedFriendSlime({
    friendUserId,
    friendUsername,
    lastFedAt,
    slimeId,
    slimeLevel,
    slimeName,
  }) {
    if (!offlineUser || foodQuantity <= 0) {
      addNotification('No slime food available.')
      return
    }
    const result = getMockFriendFeedResult({ foodQuantity, lastFedAt, slimeLevel })

    if (result.reason === 'SLIME_ALREADY_ADULT') {
      addNotification('This slime has reached 100% of its potential!')
      return
    }
    if (result.reason === 'FEED_COOLDOWN_ACTIVE') {
      addNotification(result.message || `${friendUsername}'s ${slimeName} slime is not hungry yet.`)
      return
    }
    try {
      audioManager.playSfx(SOUND_KEYS.EATING)
      const feedResult = await feedFriendSlimeOnlineFirst({
        friendUserId,
        slimeId,
        userId: offlineUser.id,
      })

      setFoodQuantity((currentQuantity) => (
        feedResult?.foodFactoryStock
          ? feedResult.foodFactoryStock.quantity
          : Math.max(0, currentQuantity - 1)
      ))

      const fedSlime = feedResult?.slime || feedResult?.data?.slime
      if (fedSlime) {
        setFriendYards((currentYards) => currentYards.map((yard) => (
          yard.id === friendUserId
            ? {
              ...yard,
              slimes: yard.slimes.map((slime) => (
                slime.id === slimeId ? fedSlime : slime
              )),
            }
            : yard
        )))
      }

      addNotification(`You fed ${friendUsername}'s slime.`)
    } catch (error) {
      notifyActionFailure(`Unable to feed ${friendUsername}'s slime.`, error)
    }
  }

  async function handlePokeFriendSlime({ friendUserId, friendUsername, slimeId, slimeName }) {
    if (!offlineUser) {
      return
    }

    try {
      await pokeFriendSlimeOnlineFirst({
        friendUserId,
        slimeId,
        userId: offlineUser.id,
      })
      addNotification(`You poked ${friendUsername}'s ${slimeName} slime.`)
    } catch (error) {
      notifyActionFailure(`Unable to poke ${friendUsername}'s slime.`, error)
    }
  }

  function handleFriendSlimeDeathAnimationEnd(slimeId) {
    setFriendYards((currentYards) => currentYards.map((yard) => ({
      ...yard,
      slimes: yard.slimes.filter((slime) => slime.id !== slimeId),
    })))
    setFriendDyingSlimeIds((currentIds) => (
      currentIds.filter((currentId) => currentId !== slimeId)
    ))
  }

  return {
    friendAppearingSlimeIds,
    friendDyingSlimeIds,
    friendYards,
    handleFeedFriendSlime,
    handleFriendSlimeDeathAnimationEnd,
    handlePokeFriendSlime,
    handleRealtimeFriendYardEvent,
    removeOfflineFriendYard,
    requestFriendYardRefresh,
  }
}
