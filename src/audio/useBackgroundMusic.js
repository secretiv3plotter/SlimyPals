import { useEffect, useRef } from 'react'
import audioManager from './audioManager'
import { SOUND_KEYS } from './soundFiles'

const DEFAULT_LOOPING_SFX = []

export function useBackgroundMusic(
  soundKey = SOUND_KEYS.BGM_LOOP,
  loopingSfx = DEFAULT_LOOPING_SFX,
  enabled = true,
) {
  const isPlayingRef = useRef(false)
  const isStartingRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      audioManager.stopAllAudio()
      isPlayingRef.current = false
      isStartingRef.current = false
      return undefined
    }

    let isDisposed = false
    const shouldPlay = () => !isDisposed && document.visibilityState === 'visible'

    async function startBackgroundMusic() {
      if (!shouldPlay() || isPlayingRef.current || isStartingRef.current) {
        return
      }

      isStartingRef.current = true
      try {
        const bgmStarted = await audioManager.playBgm(soundKey)
        if (!shouldPlay()) {
          audioManager.stopAllAudio()
          return
        }
        await Promise.all(loopingSfx.map((loopingSfxConfig) => {
          const config = typeof loopingSfxConfig === 'string'
            ? { soundKey: loopingSfxConfig }
            : loopingSfxConfig

          return audioManager.playLoopingSfx(config.soundKey, {
            volume: config.volume,
          })
        }))
        if (!isDisposed && bgmStarted) {
          isPlayingRef.current = true
        }
      } catch {
        // If it failed, we allow another attempt on the next interaction
      } finally {
        isStartingRef.current = false
      }
    }

    // Initial attempt
    startBackgroundMusic()

    const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'click']
    const handleInteraction = () => {
      startBackgroundMusic()
    }
    const stopBackgroundMusic = () => {
      audioManager.stopAllAudio()
      isPlayingRef.current = false
      isStartingRef.current = false
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopBackgroundMusic()
        return
      }

      startBackgroundMusic()
    }
    const handlePageHide = () => {
      stopBackgroundMusic()
      audioManager.suspend().catch(() => {
        // Some browsers reject suspension during page teardown.
      })
    }

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleInteraction)
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', stopBackgroundMusic)

    return () => {
      isDisposed = true
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleInteraction)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', stopBackgroundMusic)
      stopBackgroundMusic()
    }
  }, [enabled, loopingSfx, soundKey])

  useEffect(() => {
    if (!enabled || !isPlayingRef.current) {
      return
    }

    loopingSfx.forEach((loopingSfxConfig) => {
      const config = typeof loopingSfxConfig === 'string'
        ? { soundKey: loopingSfxConfig }
        : loopingSfxConfig

      audioManager.setLoopingSfxVolume(config.soundKey, config.volume)
    })
  }, [enabled, loopingSfx])
}
