import { useCallback, useEffect, useRef } from 'react'
import audioManager from '../../audio/audioManager'
import { SOUND_KEYS } from '../../audio/soundFiles'
import { getSlimeDisplayName } from '../../domain/slimes/slimeText'
import { SYNC_REALTIME_EVENT } from '../../infrastructure/offlineSync'
import {
  REALTIME_CONNECTION_STATUSES,
  SERVER_REALTIME_EVENTS,
  websocketClient,
} from '../../infrastructure/realtime'
import { getSummonRaritySoundKey } from './useOwnedSlimeActions'
import {
  addRealtimeNotification,
  clearWebsocketNotificationTimeout,
  getRealtimeEventKey,
  getRealtimeNotificationMessage,
  shouldRefreshFriendMenu,
  shouldRefreshFriendYards,
} from '../realtime/realtimeHelpers'

export function useRealtimeDomainEvents({
  accessToken,
  addNotification,
  currentUserId,
  handleRealtimeFriendYardEvent,
  pendingLocalDeleteSlimeIdsRef,
  pendingLocalFeedSlimeIdsRef,
  pendingLocalFoodProductionCountRef,
  pendingLocalSummonCountRef,
  realtimeHandledDeleteSlimeIdsRef,
  realtimeNotificationKeysRef,
  refreshFriendMenu,
  removeOfflineFriendYard,
  requestFriendYardRefresh,
  setDyingSlimeIds,
  setFoodFactoryAnimationRun,
  setFoodQuantity,
  setOfflineUser,
  setSlimes,
  setSummoningOrbAnimationRun,
  triggerAppearingSlime,
  triggerPokedSlime,
  websocketNotificationTimeoutsRef,
}) {
  const refreshFriendMenuRef = useRef(refreshFriendMenu)
  const processedRealtimeEventKeysRef = useRef(new Set())

  const handleRealtimeDomainEvent = useCallback((event, eventCurrentUserId) => {
    const payload = event?.payload || {}
    const realtimeEventKey = getRealtimeEventKey(event)

    if (realtimeEventKey) {
      if (processedRealtimeEventKeysRef.current.has(realtimeEventKey)) {
        return
      }

      processedRealtimeEventKeysRef.current.add(realtimeEventKey)
      window.setTimeout(() => {
        processedRealtimeEventKeysRef.current.delete(realtimeEventKey)
      }, 5000)
    }

    if (event?.type === SERVER_REALTIME_EVENTS.INTERACTION_CREATED) {
      if (payload.actionType === 'poke') {
        triggerPokedSlime(payload.slimeId)
      }

      return
    }

    if (payload.userId && payload.userId !== eventCurrentUserId) {
      handleRealtimeFriendYardEvent(event)
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED && payload.slime) {
      const isLocalEcho = pendingLocalSummonCountRef.current > 0
      if (isLocalEcho) {
        pendingLocalSummonCountRef.current -= 1
        clearWebsocketNotificationTimeout(websocketNotificationTimeoutsRef, `summon:${payload.slime.id}`)
      } else {
        audioManager.playSfx(SOUND_KEYS.SUMMON_2)
        setSummoningOrbAnimationRun((run) => run + 1)
        const raritySoundKey = getSummonRaritySoundKey(payload.slime)
        if (raritySoundKey) {
          audioManager.playSfx(raritySoundKey)
        }
        triggerAppearingSlime(payload.slime.id)
      }
      addRealtimeNotification({
        callback: () => addNotification(`You summoned a ${getSlimeDisplayName(payload.slime)} slime.`),
        key: `summon:${payload.slime.id}`,
        handledKeysRef: realtimeNotificationKeysRef,
      })

      setSlimes((currentSlimes) => (
        currentSlimes.some((slime) => slime.id === payload.slime.id)
          ? currentSlimes
          : [...currentSlimes, payload.slime]
      ))
      if (payload.user) {
        setOfflineUser(payload.user)
      }
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED && payload.slime) {
      const isLocalFeedEcho = pendingLocalFeedSlimeIdsRef.current.has(payload.slime.id)
      if (isLocalFeedEcho) {
        pendingLocalFeedSlimeIdsRef.current.delete(payload.slime.id)
        clearWebsocketNotificationTimeout(websocketNotificationTimeoutsRef, `feed:${payload.slime.id}`)
      }

      setSlimes((currentSlimes) => currentSlimes.map((slime) => (
        slime.id === payload.slime.id ? payload.slime : slime
      )))

      if (!payload.senderId) {
        addRealtimeNotification({
          callback: () => addNotification(`Your ${getSlimeDisplayName(payload.slime)} slime has leveled up!`),
          key: `feed:${payload.slime.id}`,
          handledKeysRef: realtimeNotificationKeysRef,
        })
      }
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_DELETED && payload.slimeId) {
      const isLocalDeleteEcho = pendingLocalDeleteSlimeIdsRef.current.has(payload.slimeId)
      if (isLocalDeleteEcho) {
        pendingLocalDeleteSlimeIdsRef.current.delete(payload.slimeId)
        realtimeHandledDeleteSlimeIdsRef.current.add(payload.slimeId)
        clearWebsocketNotificationTimeout(websocketNotificationTimeoutsRef, `delete:${payload.slimeId}`)
      }

      setDyingSlimeIds((currentIds) => (
        currentIds.includes(payload.slimeId) ? currentIds : [...currentIds, payload.slimeId]
      ))
      audioManager.playSfx(SOUND_KEYS.KILL)
      addRealtimeNotification({
        callback: () => addNotification('One of your slimes disappeared.'),
        key: `delete:${payload.slimeId}`,
        handledKeysRef: realtimeNotificationKeysRef,
      })
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_FOOD_UPDATED) {
      const foodFactoryStock = payload.foodFactoryStock || payload.factory
      if (foodFactoryStock) {
        setFoodQuantity(foodFactoryStock.quantity)
      }

      if (payload.producedQuantity > 0) {
        if (pendingLocalFoodProductionCountRef.current > 0) {
          pendingLocalFoodProductionCountRef.current -= 1
          clearWebsocketNotificationTimeout(websocketNotificationTimeoutsRef, 'food-production')
        } else {
          audioManager.playSfx(SOUND_KEYS.FACTORY)
          setFoodFactoryAnimationRun((run) => run + 1)
        }
        addRealtimeNotification({
          callback: () => addNotification(`Your factory produced ${payload.producedQuantity} food.`),
          key: 'food-production',
          handledKeysRef: realtimeNotificationKeysRef,
        })
      }
    }
  }, [
    addNotification,
    handleRealtimeFriendYardEvent,
    pendingLocalDeleteSlimeIdsRef,
    pendingLocalFeedSlimeIdsRef,
    pendingLocalFoodProductionCountRef,
    pendingLocalSummonCountRef,
    realtimeHandledDeleteSlimeIdsRef,
    realtimeNotificationKeysRef,
    setDyingSlimeIds,
    setFoodFactoryAnimationRun,
    setFoodQuantity,
    setOfflineUser,
    setSlimes,
    setSummoningOrbAnimationRun,
    triggerAppearingSlime,
    triggerPokedSlime,
    websocketNotificationTimeoutsRef,
  ])

  useEffect(() => {
    refreshFriendMenuRef.current = refreshFriendMenu
  }, [refreshFriendMenu])

  useEffect(() => {
    if (!accessToken) {
      websocketClient.disconnect()
      return undefined
    }

    const unsubscribe = websocketClient.subscribe((event) => {
      if (shouldRefreshFriendMenu(event)) {
        refreshFriendMenuRef.current()
      }

      if (event?.type === SERVER_REALTIME_EVENTS.FRIEND_OFFLINE) {
        removeOfflineFriendYard(event.payload?.userId)
      }

      if (shouldRefreshFriendYards(event)) {
        requestFriendYardRefresh()
      }

      handleRealtimeDomainEvent(event, currentUserId)

      const notificationMessage = getRealtimeNotificationMessage(event, currentUserId)
      if (notificationMessage) {
        addNotification(notificationMessage)
      }
    })
    const unsubscribeStatus = websocketClient.subscribeToStatus((status) => {
      if (status === REALTIME_CONNECTION_STATUSES.OPEN) {
        refreshFriendMenuRef.current()
      }
    })

    websocketClient.connect({ token: accessToken })
    refreshFriendMenuRef.current()

    return () => {
      unsubscribe()
      unsubscribeStatus()
      websocketClient.disconnect()
    }
  }, [
    accessToken,
    addNotification,
    currentUserId,
    handleRealtimeDomainEvent,
    removeOfflineFriendYard,
    requestFriendYardRefresh,
  ])

  useEffect(() => {
    function handleSyncRealtimeEvent(event) {
      handleRealtimeDomainEvent(event.detail, currentUserId)
    }

    window.addEventListener(SYNC_REALTIME_EVENT, handleSyncRealtimeEvent)

    return () => {
      window.removeEventListener(SYNC_REALTIME_EVENT, handleSyncRealtimeEvent)
    }
  }, [currentUserId, handleRealtimeDomainEvent])
}
