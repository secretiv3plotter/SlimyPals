import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import audioManager from './audio/audioManager'
import { SOUND_KEYS } from './audio/soundFiles'

const unlockAudio = () => {
  audioManager.unlock()
  window.removeEventListener('pointerdown', unlockAudio)
  window.removeEventListener('keydown', unlockAudio)
  window.removeEventListener('touchstart', unlockAudio)
}

window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('keydown', unlockAudio)
window.addEventListener('touchstart', unlockAudio)

const pauseAudioWhenPageIsHidden = () => {
  if (document.visibilityState === 'hidden') {
    audioManager.suspend().catch(() => undefined)
  }
}

document.addEventListener('visibilitychange', pauseAudioWhenPageIsHidden)
window.addEventListener('pagehide', () => {
  audioManager.suspend().catch(() => undefined)
})
window.addEventListener('beforeunload', () => {
  audioManager.stopAllAudio()
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Unable to register offline service worker:', error)
    })
  })
}

document.addEventListener('click', (e) => {
  const button = e.target.closest('button, [role="button"], a');
  if (button) {
    const isActionContainer = button.closest('.menu-modal, .unfriend-popup, .auth-screen, .menu-modal-backdrop, .auth-card, .menu-button');
    if (isActionContainer) {
      audioManager.playSfx(SOUND_KEYS.CLICK, { volume: 0.5 });
    }
  }
}, true);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
