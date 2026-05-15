import { useCallback, useEffect, useRef, useState } from 'react'
import menuButtonSprite from '../assets/buttons/menu button.png'
import { useDomainHydration } from '../features/domain'
import { GameMenu, SlimeDeleteConfirm, useFriendMenuState } from '../features/menu'
import { AppNotificationLayer } from '../features/notifications'
import { WorldView } from '../features/world'
import { getMaximizedWorldView, getScreenViewSize } from '../features/world/layout/worldLayout'
import { logoutAuthSession } from '../infrastructure/authSession'
import { GAME_LIMITS } from '../infrastructure/db/constants'
import { useFoodFactoryActions } from './hooks/useFoodFactoryActions'
import { useFriendYards } from './hooks/useFriendYards'
import { useOwnedSlimeActions } from './hooks/useOwnedSlimeActions'
import { useRealtimeDomainEvents } from './hooks/useRealtimeDomainEvents'

function AuthenticatedGame({ authSession, user }) {
  const isAuthenticated = true
  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [canProduceFood, setCanProduceFood] = useState(false)
  const [foodQuantity, setFoodQuantity] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [notifications, setNotifications] = useState([])
  const [offlineUser, setOfflineUser] = useState(null)
  const [pokedSlimeIds, setPokedSlimeIds] = useState([])
  const [appearingSlimeIds, setAppearingSlimeIds] = useState([])
  const [dyingSlimeIds, setDyingSlimeIds] = useState([])
  const [pendingDeleteSlime, setPendingDeleteSlime] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const friendMenu = useFriendMenuState()
  const pendingLocalDeleteSlimeIdsRef = useRef(new Set())
  const pendingLocalFeedSlimeIdsRef = useRef(new Set())
  const pendingLocalFoodProductionCountRef = useRef(0)
  const pendingLocalSummonCountRef = useRef(0)
  const realtimeHandledDeleteSlimeIdsRef = useRef(new Set())
  const realtimeNotificationKeysRef = useRef(new Set())
  const websocketNotificationTimeoutsRef = useRef(new Map())
  const maxSlimeCapacity = offlineUser?.max_slime_capacity ?? GAME_LIMITS.MAX_SLIMES
  const canProduceFromFactory = canProduceFood && foodQuantity < GAME_LIMITS.MAX_FOOD_STOCK
  const canSummonFromGround = (
    (offlineUser?.daily_summons_left ?? 0) > 0 &&
    slimes.length < maxSlimeCapacity
  )
  const displayedSlimes = slimes.slice(0, 25)
  const offlineUserId = offlineUser?.id

  const addNotification = useCallback((message) => {
    setNotifications((currentNotifications) => [
      ...currentNotifications,
      {
        id: crypto.randomUUID(),
        message,
      },
    ].slice(-3))
  }, [])

  const {
    friendAppearingSlimeIds,
    friendDyingSlimeIds,
    friendYards,
    handleFeedFriendSlime,
    handleFriendSlimeDeathAnimationEnd,
    handlePokeFriendSlime,
    handleRealtimeFriendYardEvent,
    removeOfflineFriendYard,
    requestFriendYardRefresh,
  } = useFriendYards({
    addNotification,
    foodQuantity,
    friendMenuFriends: friendMenu.friends,
    isAuthenticated,
    offlineUser,
    setFoodQuantity,
  })

  const {
    handleFoodFactoryAnimationEnd,
    handleFoodFactoryClick,
    refreshFoodProductionReadiness,
  } = useFoodFactoryActions({
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
  })

  useDomainHydration({
    authUserId: user?.id,
    offlineUserId,
    setCanProduceFood,
    setFoodQuantity,
    setOfflineUser,
    setSlimes,
  })

  const triggerAppearingSlime = useCallback((slimeId) => {
    if (!slimeId) {
      return
    }

    setAppearingSlimeIds((currentIds) => (
      currentIds.includes(slimeId) ? currentIds : [...currentIds, slimeId]
    ))
    window.setTimeout(() => {
      setAppearingSlimeIds((currentIds) => (
        currentIds.filter((currentId) => currentId !== slimeId)
      ))
    }, 1000)
  }, [])

  const {
    handleFeedSlime,
    handleRemoveSlime,
    handleSummonSlime,
  } = useOwnedSlimeActions({
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
  })

  const triggerPokedSlime = useCallback((slimeId) => {
    if (!slimeId) {
      return
    }

    setPokedSlimeIds((currentIds) => [...currentIds, slimeId])
    window.setTimeout(() => {
      setPokedSlimeIds((currentIds) => (
        currentIds.filter((currentId) => currentId !== slimeId)
      ))
    }, 800)
  }, [])

  useRealtimeDomainEvents({
    accessToken: authSession?.accessToken,
    addNotification,
    currentUserId: user?.id,
    handleRealtimeFriendYardEvent,
    pendingLocalDeleteSlimeIdsRef,
    pendingLocalFeedSlimeIdsRef,
    pendingLocalFoodProductionCountRef,
    pendingLocalSummonCountRef,
    realtimeHandledDeleteSlimeIdsRef,
    realtimeNotificationKeysRef,
    refreshFriendMenu: friendMenu.refreshFriendMenu,
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
  })

  useEffect(() => () => {
    websocketNotificationTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    websocketNotificationTimeoutsRef.current.clear()
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  function openMenu() {
    setMenuMode('main')
    setIsMenuOpen(true)
  }

  function closeMenu() {
    setIsMenuOpen(false)
    setMenuMode('main')
  }

  async function confirmLogout() {
    await logoutAuthSession()
    closeMenu()
  }

  function dismissNotification(notificationId) {
    setNotifications((currentNotifications) => (
      currentNotifications.filter((notification) => notification.id !== notificationId)
    ))
  }

  function handleSlimeDeathAnimationEnd(slimeId) {
    setSlimes((currentSlimes) => (
      currentSlimes.filter((currentSlime) => currentSlime.id !== slimeId)
    ))
    setDyingSlimeIds((currentIds) => (
      currentIds.filter((currentId) => currentId !== slimeId)
    ))
  }

  return (
    <main className="relative h-svh w-screen overflow-hidden bg-[#547244]">
      <button
        className="menu-button"
        type="button"
        aria-label="Open menu"
        aria-expanded={isMenuOpen}
        onClick={openMenu}
      >
        <img src={menuButtonSprite} alt="" draggable="false" />
      </button>
      <output className="sr-only" aria-live="polite">
        {foodQuantity} slime food available
      </output>
      <AppNotificationLayer
        notifications={notifications}
        onDismiss={dismissNotification}
        setNotifications={setNotifications}
      />
      <GameMenu
        isOpen={isMenuOpen}
        menuMode={menuMode}
        onClose={closeMenu}
        onConfirmLogout={confirmLogout}
        onSetMenuMode={setMenuMode}
        username={user?.username}
        {...friendMenu}
      />
      <SlimeDeleteConfirm
        slime={pendingDeleteSlime}
        onCancel={() => setPendingDeleteSlime(null)}
        onConfirm={handleRemoveSlime}
      />
      <WorldView
        canProduceFood={canProduceFromFactory}
        canSummon={canSummonFromGround}
        appearingSlimeIds={appearingSlimeIds}
        displayedSlimes={displayedSlimes}
        dyingSlimeIds={dyingSlimeIds}
        friendAppearingSlimeIds={friendAppearingSlimeIds}
        friendDyingSlimeIds={friendDyingSlimeIds}
        foodFactoryAnimationRun={foodFactoryAnimationRun}
        friendYards={friendYards}
        foodQuantity={foodQuantity}
        onFoodFactoryAnimationEnd={handleFoodFactoryAnimationEnd}
        onFoodFactoryClick={handleFoodFactoryClick}
        onFeedFriendSlime={handleFeedFriendSlime}
        onFeedSlime={handleFeedSlime}
        onFriendSlimeDeathAnimationEnd={handleFriendSlimeDeathAnimationEnd}
        onPokeFriendSlime={handlePokeFriendSlime}
        onRemoveSlime={setPendingDeleteSlime}
        pokedSlimeIds={pokedSlimeIds}
        onSlimeDeathAnimationEnd={handleSlimeDeathAnimationEnd}
        onSlimeSummon={handleSummonSlime}
        onSummoningOrbAnimationEnd={() => setSummoningOrbAnimationRun(0)}
        summoningOrbAnimationRun={summoningOrbAnimationRun}
        worldView={worldView}
      />
    </main>
  )
}

export default AuthenticatedGame
