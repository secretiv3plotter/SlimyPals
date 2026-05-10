import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import audioManager from './audio/audioManager'

// Unlock audio on first interaction so music can start immediately after login
const unlockAudio = () => {
  audioManager.unlock()
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
  window.removeEventListener('touchstart', unlockAudio)
}

window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('keydown', unlockAudio)
window.addEventListener('touchstart', unlockAudio)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
