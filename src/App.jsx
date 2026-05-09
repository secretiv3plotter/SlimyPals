import { useEffect, useState } from 'react'
import menuButtonSprite from './assets/sprites/menu button.png'
import AppNotificationLayer from './components/AppNotificationLayer'
import GameMenu from './components/GameMenu'
import SlimeDeleteConfirm from './components/SlimeDeleteConfirm'
import WorldView from './components/WorldView'
import { useDomainHydration } from './hooks/useDomainHydration'
import { getSlimeDisplayName } from './game/slimeText'
import { getMaximizedWorldView, getScreenViewSize } from './game/worldLayout'
import { logoutAuthSession } from './services/authSession'
import {
  feedOwnedSlime,
  getFoodProductionAllowed,
  getMockFriendFeedResult,
  produceOwnedFood,
  removeOwnedSlime,
  summonOwnedSlime,
} from './services/slimyPalsDomain'
import { queueFeedFriendSlime } from './services/offlineSync'

function App() {
  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [canProduceFood, setCanProduceFood] = useState(false)
  const [foodQuantity, setFoodQuantity] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [notifications, setNotifications] = useState([])
  const [offlineUser, setOfflineUser] = useState(null)
  const [pendingDeleteSlime, setPendingDeleteSlime] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
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

    if (canSummonFromGround) {
      setSummoningOrbAnimationRun((run) => run + 1)
    }

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

    if (canProduceFood) {
      setFoodFactoryAnimationRun((run) => run + 1)
    }

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

    try {
      const { foodFactoryStock, slime } = await feedOwnedSlime({
        slimeId,
        userId: offlineUser.id,
      })

      setFoodQuantity(foodFactoryStock.quantity)
      setSlimes((currentSlimes) => (
        currentSlimes.map((currentSlime) => (
          currentSlime.id === slime.id ? slime : currentSlime
        ))
      ))
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

    try {
      await removeOwnedSlime({ slimeId, userId: offlineUser.id })
      setSlimes((currentSlimes) => (
        currentSlimes.filter((currentSlime) => currentSlime.id !== slimeId)
      ))
      setPendingDeleteSlime(null)
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      notifyActionFailure('Unable to remove slime.', error)
    }
  }

  async function queueFriendFeedAction({ friendUserId, slimeId, userId }) {
    try {
      await queueFeedFriendSlime({ friendUserId, slimeId, userId })
    } catch (error) {
      console.warn('Unable to queue friend feed action:', error)
    }
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
        foodFactoryAnimationRun={foodFactoryAnimationRun}
        foodQuantity={foodQuantity}
        onFoodFactoryAnimationEnd={handleFoodFactoryAnimationEnd}
        onFoodFactoryClick={handleFoodFactoryClick}
        onFeedFriendSlime={handleFeedFriendSlime}
        onFeedSlime={handleFeedSlime}
        onRemoveSlime={setPendingDeleteSlime}
        onSlimeSummon={handleSummonSlime}
        onSummoningOrbAnimationEnd={() => setSummoningOrbAnimationRun(0)}
        summoningOrbAnimationRun={summoningOrbAnimationRun}
        worldView={worldView}
      />
    </main>
  )
}

export default App
