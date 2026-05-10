import { useEffect, useRef } from 'react'
import audioManager from './audioManager'
import { SOUND_KEYS } from './soundFiles'

const DEFAULT_LOOPING_SFX_KEYS = []

export function useBackgroundMusic(
  soundKey = SOUND_KEYS.BGM_LOOP,
  loopingSfxKeys = DEFAULT_LOOPING_SFX_KEYS,
) {
  const isPlayingRef = useRef(false)
  const isStartingRef = useRef(false)

  useEffect(() => {
    let isDisposed = false

    async function startBackgroundMusic() {
      if (isDisposed || isPlayingRef.current || isStartingRef.current) {
        return
      }

      isStartingRef.current = true
      try {
        const bgmStarted = await audioManager.playBgm(soundKey)
        await Promise.all(
          loopingSfxKeys.map((loopingSfxKey) =>
            audioManager.playLoopingSfx(loopingSfxKey),
          ),
        )
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

    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleInteraction)
    })

    return () => {
      isDisposed = true
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleInteraction)
      })
      audioManager.stopBgm()
      audioManager.stopAllLoopingSfx()
      isPlayingRef.current = false
      isStartingRef.current = false
    }
  }, [loopingSfxKeys, soundKey])
}
