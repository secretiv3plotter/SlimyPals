import { useEffect, useState } from 'react'
import menuButtonSprite from './assets/sprites/menu button.png'
import GameMenu from './components/GameMenu'
import AuthScreen from './components/auth/AuthScreen'
import WorldView from './components/WorldView'
import { getOrCreateOfflineUser } from './game/offlineUser'
import { getMaximizedWorldView, getScreenViewSize } from './game/worldLayout'
import { summonSlime } from './services/slimeManagement'
import { slimesRepository } from './services/slimyPalsDb'

function App() {
  const [worldView] = useState(() => getMaximizedWorldView(getScreenViewSize()))
  const [foodFactoryAnimationRun, setFoodFactoryAnimationRun] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuMode, setMenuMode] = useState('main')
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [offlineUser, setOfflineUser] = useState(null)
  const [slimes, setSlimes] = useState([])
  const [friends, setFriends] = useState([])
  const [friendName, setFriendName] = useState('')
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [summoningOrbAnimationRun, setSummoningOrbAnimationRun] = useState(0)
  const canSummonFromGround = (offlineUser?.daily_summons_left ?? 0) > 0
  const displayedSlimes = slimes.slice(0, 25)

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    let isCancelled = false

    async function loadOfflineDomain() {
      const user = await getOrCreateOfflineUser()
      const activeSlimes = await slimesRepository.listByUserId(user.id)

      if (!isCancelled) {
        setOfflineUser(user)
        setSlimes(activeSlimes)
      }
    }

    loadOfflineDomain()

    return () => {
      isCancelled = true
    }
  }, [isAuthenticated])

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
    } catch (error) {
      console.warn('Unable to summon slime:', error)
    }
  }

  function handleFoodFactoryClick(event) {
    event.stopPropagation()
    setFoodFactoryAnimationRun((run) => run + 1)
  }

  function handleAddFriend() {
    if (!friendName.trim()) return

    const newFriend = {
      id: Date.now(),
      name: friendName,

      // temp status
      online: Math.random() > 0.5,
    }

    setFriends((currentFriends) => [
      ...currentFriends,
      newFriend,
    ])

    setFriendName('')
  }

  function handleRemoveFriend(friendId) {
    setFriends((currentFriends) =>
      currentFriends.filter((friend) => friend.id !== friendId)
    )
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLogin={async () => {
          setIsAuthenticated(true)
        }}
        onRegister={async () => {
          setIsAuthenticated(true)
        }}
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
      <GameMenu
        isOpen={isMenuOpen}
        menuMode={menuMode}
        onClose={closeMenu}
        onConfirmLogout={confirmLogout}
        onSetMenuMode={setMenuMode}
        friends={friends}
        friendName={friendName}
        setFriendName={setFriendName}
        handleAddFriend={handleAddFriend}
        handleRemoveFriend={handleRemoveFriend}
        selectedFriend={selectedFriend}
        setSelectedFriend={setSelectedFriend}
      />
      <WorldView
        canSummon={canSummonFromGround}
        displayedSlimes={displayedSlimes}
        foodFactoryAnimationRun={foodFactoryAnimationRun}
        onFoodFactoryAnimationEnd={() => setFoodFactoryAnimationRun(0)}
        onFoodFactoryClick={handleFoodFactoryClick}
        onSlimeSummon={handleSummonSlime}
        onSummoningOrbAnimationEnd={() => setSummoningOrbAnimationRun(0)}
        summoningOrbAnimationRun={summoningOrbAnimationRun}
        worldView={worldView}
      />
    </main>
  )
}

export default App
