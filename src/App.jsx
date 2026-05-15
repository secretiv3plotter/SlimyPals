import { SOUND_KEYS } from './audio/soundFiles'
import { useBackgroundMusic } from './audio/useBackgroundMusic'
import AuthenticatedGame from './app/AuthenticatedGame'
import { AuthScreen, useAuthSession } from './features/auth'
import { loginAuthSession, registerAuthSession } from './infrastructure/authSession'

const GAME_BACKGROUND_LAYERS = [
  {
    soundKey: SOUND_KEYS.SUMMON_1,
    volume: 0.8,
  },
]

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

export default App
