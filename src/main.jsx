import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import audioManager from './audio/audioManager'
import { SOUND_KEYS } from './audio/soundFiles'

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

const stopAudioWhenPageIsHidden = () => {
  if (document.visibilityState === 'hidden') {
    audioManager.stopAllAudio()
  }
}

document.addEventListener('visibilitychange', stopAudioWhenPageIsHidden)
window.addEventListener('pagehide', () => {
  audioManager.suspend().catch(() => {
    // The browser may already be tearing down the page.
  })
})

// Global click listener for buttons (using capture phase to bypass stopPropagation)
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
