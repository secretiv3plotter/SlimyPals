import { useEffect, useState } from 'react'
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
import {
  feedOwnedSlime,
  getFoodProductionAllowed,
  getMockFriendFeedResult,
  produceOwnedFood,
  removeOwnedSlime,
  summonOwnedSlime,
} from './services/slimyPalsDomain'
import { GAME_LIMITS } from './services/slimyPalsDb/constants'
import { queueFeedFriendSlime } from './services/offlineSync'

function App() {
  useBackgroundMusic()

  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [canProduceFood, setCanProduceFood] = useState(false)
  const [foodQuantity, setFoodQuantity] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [notifications, setNotifications] = useState([])
  const [offlineUser, setOfflineUser] = useState(null)
  const [dyingSlimeIds, setDyingSlimeIds] = useState([])
  const [pendingDeleteSlime, setPendingDeleteSlime] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const friendMenu = useFriendMenuState()
  const { isAuthenticated } = useAuthSession()
  const canSummonFromGround = (offlineUser?.daily_summons_left ?? 0) > 0
  const displayedSlimes = slimes.slice(0, 25)
  const offlineUserId = offlineUser?.id

  useDomainHydration({
    offlineUserId,
    setCanProduceFood,
    setFoodQuantity,
    setOfflineUser,
    setSlimes,
  })

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
    setMenuMode('logged-out')
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

      setOfflineUser(user)
      setSlimes((currentSlimes) => [...currentSlimes, slime])
      addNotification(`You summoned a ${getSlimeDisplayName(slime)} slime.`)
      await refreshFoodProductionReadiness(user.id)
    } catch (error) {
      notifyActionFailure('Unable to summon slime.', error)
    }
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
        `You fed your ${getSlimeDisplayName(slime)} slime.`,
      )
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      notifyActionFailure('Unable to feed slime.', error)
    }
  }

  async function handleFeedFriendSlime({ friendUserId, friendUsername, lastFedAt, slimeId, slimeLevel, slimeName }) {
    if (!offlineUser || foodQuantity <= 0) {
      addNotification('No slime food available.')
      return
    }
    const result = getMockFriendFeedResult({ foodQuantity, lastFedAt, slimeLevel })

    if (result.reason === 'SLIME_ALREADY_ADULT') {
      addNotification(`Unable to feed ${friendUsername}'s ${slimeName} slime.`)
      return
    }
    if (result.reason === 'FEED_COOLDOWN_ACTIVE') {
      addNotification(`${friendUsername}'s ${slimeName} slime is not hungry yet.`)
      return
    }
    setFoodQuantity((currentQuantity) => Math.max(0, currentQuantity - 1))
    await queueFriendFeedAction({
      friendUserId,
      slimeId,
      userId: offlineUser.id,
    })
    console.info(`Friend POV notification: ${offlineUser.username} fed your ${slimeName} slime.`)
    console.info(`Mock fed ${friendUsername}'s ${slimeName} slime.`)
  }

  async function handleRemoveSlime(slimeId) {
    if (!offlineUser) {
      return
    }

    audioManager.playSfx(SOUND_KEYS.KILL)

    try {
      await removeOwnedSlime({ slimeId, userId: offlineUser.id })
      setPendingDeleteSlime(null)
      setDyingSlimeIds((currentIds) => (
        currentIds.includes(slimeId) ? currentIds : [...currentIds, slimeId]
      ))
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

  async function queueFriendFeedAction({ friendUserId, slimeId, userId }) {
    try {
      await queueFeedFriendSlime({ friendUserId, slimeId, userId })
    } catch (error) {
      console.warn('Unable to queue friend feed action:', error)
    }
  }

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
        {...friendMenu}
      />
      <SlimeDeleteConfirm
        slime={pendingDeleteSlime}
        onCancel={() => setPendingDeleteSlime(null)}
        onConfirm={handleRemoveSlime}
      />
      <WorldView
        canProduceFood={canProduceFood}
        canSummon={canSummonFromGround}
        displayedSlimes={displayedSlimes}
        dyingSlimeIds={dyingSlimeIds}
        foodFactoryAnimationRun={foodFactoryAnimationRun}
        foodQuantity={foodQuantity}
        onFoodFactoryAnimationEnd={handleFoodFactoryAnimationEnd}
        onFoodFactoryClick={handleFoodFactoryClick}
        onFeedFriendSlime={handleFeedFriendSlime}
        onFeedSlime={handleFeedSlime}
        onRemoveSlime={setPendingDeleteSlime}
        onSlimeDeathAnimationEnd={handleSlimeDeathAnimationEnd}
        onSlimeSummon={handleSummonSlime}
        onSummoningOrbAnimationEnd={() => setSummoningOrbAnimationRun(0)}
        summoningOrbAnimationRun={summoningOrbAnimationRun}
        worldView={worldView}
      />
    </main>
  )
}

export default App
