import { useEffect, useState } from 'react'
import menuButtonSprite from './assets/sprites/menu button.png'
import GameMenu from './components/GameMenu'
import SlimeDeleteConfirm from './components/SlimeDeleteConfirm'
import WorldView from './components/WorldView'
import { getOrCreateOfflineUser } from './game/offlineUser'
import { getMaximizedWorldView, getScreenViewSize } from './game/worldLayout'
import {
  feedSlime,
  getFoodProductionReadiness,
  produceSlimeFood,
  removeSlime,
  summonSlime,
} from './services/slimeManagement'
import { foodFactoryStockRepository, slimesRepository } from './services/slimyPalsDb'

async function getFoodProductionAllowed(userId) {
  const readiness = await getFoodProductionReadiness(userId)

  return readiness.allowed
}

function App() {
  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [canProduceFood, setCanProduceFood] = useState(false)
  const [foodQuantity, setFoodQuantity] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [offlineUser, setOfflineUser] = useState(null)
  const [pendingDeleteSlime, setPendingDeleteSlime] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const canSummonFromGround = (offlineUser?.daily_summons_left ?? 0) > 0
  const displayedSlimes = slimes.slice(0, 25)

  useEffect(() => {
    let isCancelled = false

    async function loadOfflineDomain() {
      const user = await getOrCreateOfflineUser()
      const [activeSlimes, foodFactoryStock] = await Promise.all([
        slimesRepository.listByUserId(user.id),
        foodFactoryStockRepository.getByUserId(user.id),
      ])

      if (!isCancelled) {
        setOfflineUser(user)
        setSlimes(activeSlimes)
        setFoodQuantity(foodFactoryStock?.quantity ?? 0)
        setCanProduceFood(await getFoodProductionAllowed(user.id))
      }
    }

    loadOfflineDomain()

    return () => {
      isCancelled = true
    }
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

  function confirmLogout() {
    setMenuMode('logged-out')
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

    setSummoningOrbAnimationRun((run) => run + 1)

    try {
      const { slime, user } = await summonSlime(offlineUser.id)

      setOfflineUser(user)
      setSlimes((currentSlimes) => [...currentSlimes, slime])
      await refreshFoodProductionReadiness(user.id)
    } catch (error) {
      console.warn('Unable to summon slime:', error)
    }
  }

  async function handleFoodFactoryClick(event) {
    event.stopPropagation()

    if (!offlineUser || !canProduceFood || foodFactoryAnimationRun > 0) {
      return
    }

    setFoodFactoryAnimationRun((run) => run + 1)

    try {
      const { foodFactoryStock } = await produceSlimeFood(offlineUser.id)

      setFoodQuantity(foodFactoryStock.quantity)
    } catch (error) {
      console.warn('Unable to produce slime food:', error)
      await refreshFoodProductionReadiness(offlineUser.id)
    }
  }

  async function handleFoodFactoryAnimationEnd() {
    setFoodFactoryAnimationRun(0)
    await refreshFoodProductionReadiness()
  }

  async function handleFeedSlime(slimeId) {
    if (!offlineUser || foodQuantity <= 0) {
      return
    }

    try {
      const { foodFactoryStock, slime } = await feedSlime({
        slimeId,
        ownerUserId: offlineUser.id,
      })

      setFoodQuantity(foodFactoryStock.quantity)
      setSlimes((currentSlimes) => (
        currentSlimes.map((currentSlime) => (
          currentSlime.id === slime.id ? slime : currentSlime
        ))
      ))
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      console.warn('Unable to feed slime:', error)
    }
  }

  async function handleRemoveSlime(slimeId) {
    if (!offlineUser) {
      return
    }

    try {
      await removeSlime({ slimeId, userId: offlineUser.id })
      setSlimes((currentSlimes) => (
        currentSlimes.filter((currentSlime) => currentSlime.id !== slimeId)
      ))
      setPendingDeleteSlime(null)
      await refreshFoodProductionReadiness(offlineUser.id)
    } catch (error) {
      console.warn('Unable to remove slime:', error)
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
