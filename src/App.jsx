import { useCallback, useEffect, useRef, useState } from 'react'
import menuButtonSprite from './assets/buttons/menu button.png'
import audioManager from './audio/audioManager'
import { SOUND_KEYS } from './audio/soundFiles'
import { useBackgroundMusic } from './audio/useBackgroundMusic'
import { AuthScreen, useAuthSession } from './features/auth'
import { useDomainHydration } from './features/domain'
import { GameMenu, SlimeDeleteConfirm, useFriendMenuState } from './features/menu'
import { AppNotificationLayer } from './features/notifications'
import { WorldView } from './features/world'
import { getSlimeDisplayName } from './game/slimeText'
import { getMaximizedWorldView, getScreenViewSize } from './game/worldLayout'
import { loginAuthSession, logoutAuthSession, registerAuthSession } from './services/authSession'
import { getFriendDomain } from './services/slimyPalsApi'
import {
  feedOwnedSlime,
  feedFriendSlimeOnlineFirst,
  getFoodProductionAllowed,
  getMockFriendFeedResult,
  pokeFriendSlimeOnlineFirst,
  produceOwnedFood,
  removeOwnedSlime,
  summonOwnedSlime,
} from './services/slimyPalsDomain'
import { GAME_LIMITS, SLIME_RARITIES } from './services/slimyPalsDb/constants'
import { REALTIME_CONNECTION_STATUSES, SERVER_REALTIME_EVENTS, websocketClient } from './services/websockets'

const GAME_BACKGROUND_LAYERS = [
  {
    soundKey: SOUND_KEYS.SUMMON_1,
    volume: 0.8,
  },
]
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

function App() {
  const { authSession, isAuthenticated, user } = useAuthSession()

  useBackgroundMusic(SOUND_KEYS.BGM_LOOP, isAuthenticated ? GAME_BACKGROUND_LAYERS : [])

  function handleLogin(credentials) {
    return loginAuthSession({
      password: credentials.password,
      username: credentials.identifier,
    })
  }

  function handleRegister(credentials) {
    return registerAuthSession(credentials)
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    )
  }

  return (
    <AuthenticatedGame
      key={user?.id || authSession?.accessToken}
      authSession={authSession}
      user={user}
    />
  )
}

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
  const [friendYards, setFriendYards] = useState([])
  const [friendYardRefreshRun, setFriendYardRefreshRun] = useState(0)
  const [friendAppearingSlimeIds, setFriendAppearingSlimeIds] = useState([])
  const [friendDyingSlimeIds, setFriendDyingSlimeIds] = useState([])
  const [pokedSlimeIds, setPokedSlimeIds] = useState([])
  const [appearingSlimeIds, setAppearingSlimeIds] = useState([])
  const [dyingSlimeIds, setDyingSlimeIds] = useState([])
  const [pendingDeleteSlime, setPendingDeleteSlime] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const friendMenu = useFriendMenuState()
  const refreshFriendMenuRef = useRef(friendMenu.refreshFriendMenu)
  const maxSlimeCapacity = offlineUser?.max_slime_capacity ?? GAME_LIMITS.MAX_SLIMES
  const canProduceFromFactory = canProduceFood && foodQuantity < GAME_LIMITS.MAX_FOOD_STOCK
  const canSummonFromGround = (
    (offlineUser?.daily_summons_left ?? 0) > 0 &&
    slimes.length < maxSlimeCapacity
  )
  const displayedSlimes = slimes.slice(0, 25)
  const offlineUserId = offlineUser?.id

  useDomainHydration({
    authUserId: user?.id,
    offlineUserId,
    setCanProduceFood,
    setFoodQuantity,
    setOfflineUser,
    setSlimes,
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
        setFriendYardRefreshRun((run) => run + 1)
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
        setFriendYardRefreshRun((run) => run + 1)
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
  }, [triggerFriendAppearingSlime])

  const handleRealtimeDomainEvent = useCallback((event, currentUserId) => {
    const payload = event?.payload || {}

    if (event?.type === SERVER_REALTIME_EVENTS.INTERACTION_CREATED) {
      if (payload.actionType === 'poke') {
        triggerPokedSlime(payload.slimeId)
      }

      return
    }

    if (payload.userId && payload.userId !== currentUserId) {
      handleRealtimeFriendYardEvent(event)
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED && payload.slime) {
      setSlimes((currentSlimes) => (
        currentSlimes.some((slime) => slime.id === payload.slime.id)
          ? currentSlimes
          : [...currentSlimes, payload.slime]
      ))
      setAppearingSlimeIds((currentIds) => (
        currentIds.includes(payload.slime.id) ? currentIds : [...currentIds, payload.slime.id]
      ))
      window.setTimeout(() => {
        setAppearingSlimeIds((currentIds) => (
          currentIds.filter((currentId) => currentId !== payload.slime.id)
        ))
      }, 1000)
      if (payload.user) {
        setOfflineUser(payload.user)
      }
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED && payload.slime) {
      setSlimes((currentSlimes) => currentSlimes.map((slime) => (
        slime.id === payload.slime.id ? payload.slime : slime
      )))
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_SLIME_DELETED && payload.slimeId) {
      setDyingSlimeIds((currentIds) => (
        currentIds.includes(payload.slimeId) ? currentIds : [...currentIds, payload.slimeId]
      ))
      return
    }

    if (event?.type === SERVER_REALTIME_EVENTS.DOMAIN_FOOD_UPDATED) {
      const foodFactoryStock = payload.foodFactoryStock || payload.factory
      if (foodFactoryStock) {
        setFoodQuantity(foodFactoryStock.quantity)
      }
    }
  }, [handleRealtimeFriendYardEvent, triggerPokedSlime])

  useEffect(() => {
    refreshFriendMenuRef.current = friendMenu.refreshFriendMenu
  }, [friendMenu.refreshFriendMenu])

  useEffect(() => {
    if (!authSession?.accessToken) {
      websocketClient.disconnect()
      return undefined
    }

    const unsubscribe = websocketClient.subscribe((event) => {
      if (shouldRefreshFriendMenu(event)) {
        refreshFriendMenuRef.current()
      }

      if (event?.type === SERVER_REALTIME_EVENTS.FRIEND_OFFLINE) {
        setFriendYards((currentYards) => (
          currentYards.filter((yard) => yard.id !== event.payload?.userId)
        ))
      }

      if (shouldRefreshFriendYards(event)) {
        setFriendYardRefreshRun((run) => run + 1)
      }

      handleRealtimeDomainEvent(event, user?.id)

      const notificationMessage = getRealtimeNotificationMessage(event, user?.id)
      if (notificationMessage) {
        addNotification(notificationMessage)
      }
    })
    const unsubscribeStatus = websocketClient.subscribeToStatus((status) => {
      if (status === REALTIME_CONNECTION_STATUSES.OPEN) {
        refreshFriendMenuRef.current()
      }
    })

    websocketClient.connect({ token: authSession.accessToken })
    refreshFriendMenuRef.current()

    return () => {
      unsubscribe()
      unsubscribeStatus()
      websocketClient.disconnect()
    }
  }, [authSession?.accessToken, handleRealtimeDomainEvent, user?.id])

  useEffect(() => {
    let isDisposed = false
    const onlineFriends = isAuthenticated
      ? friendMenu.friends.filter((friend) => friend.online).slice(0, 4)
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
  }, [friendMenu.friends, friendYardRefreshRun, isAuthenticated])

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

  function addNotification(message) {
    setNotifications((currentNotifications) => [
      ...currentNotifications,
      {
        id: crypto.randomUUID(),
        message,
      },
    ].slice(-3))
  }

  function dismissNotification(notificationId) {
    setNotifications((currentNotifications) => (
      currentNotifications.filter((notification) => notification.id !== notificationId)
    ))
  }

  function notifyActionFailure(message, error) {
    console.warn(message, error)
    addNotification(message)
  }

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
      setAppearingSlimeIds((currentIds) => (
        currentIds.includes(slime.id) ? currentIds : [...currentIds, slime.id]
      ))
      window.setTimeout(() => {
        setAppearingSlimeIds((currentIds) => (
          currentIds.filter((currentId) => currentId !== slime.id)
        ))
      }, 1000)
      addNotification(`You summoned a ${getSlimeDisplayName(slime)} slime.`)
      await refreshFoodProductionReadiness(user.id)
    } catch (error) {
      notifyActionFailure('Unable to summon slime.', error)
    }
  }

  function getSummonRaritySoundKey(slime) {
    return SUMMON_RARITY_SOUND_KEYS[slime.rarity]?.[slime.type]
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

    try {
      const { foodFactoryStock, producedQuantity } = await produceOwnedFood(offlineUser.id)

      setFoodQuantity(foodFactoryStock.quantity)
      addNotification(`Your factory produced ${producedQuantity} food.`)
    } catch (error) {
      notifyActionFailure('Unable to produce slime food.', error)
      await refreshFoodProductionReadiness(offlineUser.id)
    }
  }

  async function handleFoodFactoryAnimationEnd() {
    setFoodFactoryAnimationRun(0)
    await refreshFoodProductionReadiness()
  }

  async function handleFeedSlime(slimeId) {
    if (!offlineUser || foodQuantity <= 0) {
      addNotification('No slime food available.')
      return
    }

    const previousSlime = slimes.find((currentSlime) => currentSlime.id === slimeId)

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
      addNotification(
        `Your ${getSlimeDisplayName(slime)} slime has leveled up!`,
      )
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      notifyActionFailure(error.message || 'Unable to feed slime.', error)
    }
  }

  async function handleFeedFriendSlime({ friendUserId, friendUsername, lastFedAt, slimeId, slimeLevel, slimeName }) {
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

  async function handleRemoveSlime(slimeId) {
    if (!offlineUser) {
      return
    }

    setPendingDeleteSlime(null)

    try {
      await removeOwnedSlime({ slimeId, userId: offlineUser.id })
      setDyingSlimeIds((currentIds) => (
        currentIds.includes(slimeId) ? currentIds : [...currentIds, slimeId]
      ))
      audioManager.playSfx(SOUND_KEYS.KILL)
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      notifyActionFailure('Unable to remove slime.', error)
    }
  }

  function handleSlimeDeathAnimationEnd(slimeId) {
    setSlimes((currentSlimes) => (
      currentSlimes.filter((currentSlime) => currentSlime.id !== slimeId)
    ))
    setDyingSlimeIds((currentIds) => (
      currentIds.filter((currentId) => currentId !== slimeId)
    ))
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

function shouldRefreshFriendMenu(event) {
  return [
    SERVER_REALTIME_EVENTS.FRIEND_LIST_CHANGED,
    SERVER_REALTIME_EVENTS.FRIEND_ONLINE,
    SERVER_REALTIME_EVENTS.FRIEND_OFFLINE,
    SERVER_REALTIME_EVENTS.INITIAL_PRESENCE,
  ].includes(event?.type)
}

function shouldRefreshFriendYards(event) {
  return [
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_CREATED,
    SERVER_REALTIME_EVENTS.DOMAIN_SLIME_UPDATED,
  ].includes(event?.type)
}

function getRealtimeNotificationMessage(event, currentUserId) {
  if (event?.type === SERVER_REALTIME_EVENTS.FRIEND_ONLINE) {
    const username = event.payload?.username
    return username ? `${username} is online.` : null
  }

  if (event?.type === SERVER_REALTIME_EVENTS.INTERACTION_CREATED) {
    const { actionType, ownerUserId, senderId, senderUsername } = event.payload || {}

    if (ownerUserId === currentUserId && senderId !== currentUserId && senderUsername) {
      return actionType === 'feed'
        ? `${senderUsername} fed one of your slimes.`
        : `${senderUsername} poked one of your slimes.`
    }

    return null
  }

  if (event?.type !== SERVER_REALTIME_EVENTS.FRIEND_LIST_CHANGED) {
    return null
  }

  const { action, receiverId, receiverUsername, senderId, senderUsername } = event.payload || {}

  if (action === 'friend.request.received') {
    if (receiverId === currentUserId && senderUsername) {
      return `${senderUsername} sent you a friend request.`
    }

    if (senderId === currentUserId && receiverUsername) {
      return `Friend request sent to ${receiverUsername}.`
    }
  }

  if (action === 'friend.request.auto_accepted' || action === 'friend.request.accepted') {
    return 'Friend list updated.'
  }

  if (action === 'friend.request.removed' || action === 'friend.removed') {
    return 'Friend list updated.'
  }

  return null
}

export default App
