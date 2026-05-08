import { useEffect, useRef } from 'react'
import audioManager from './audioManager'
import { SOUND_KEYS } from './soundFiles'

export function useBackgroundMusic(
  soundKey = SOUND_KEYS.BGM_LOOP,
  loopingSfxKeys = [],
) {
  const hasStartedRef = useRef(false)

  useEffect(() => {
    let isDisposed = false

    async function startBackgroundMusic() {
      if (isDisposed) {
        return
      }

      if (hasStartedRef.current) {
        return
      }

      hasStartedRef.current = true
      await audioManager.playBgm(soundKey)
      await Promise.all(
        loopingSfxKeys.map((loopingSfxKey) =>
          audioManager.playLoopingSfx(loopingSfxKey),
        ),
      )
    }

    // Try autoplay immediately on load.
    startBackgroundMusic()

    const interactionEvents = ['pointerdown', 'keydown', 'touchstart']
    interactionEvents.forEach((eventName) => {
      window.addEventListener(eventName, startBackgroundMusic, { once: true })
    })

    return () => {
      isDisposed = true
      interactionEvents.forEach((eventName) => {
        window.removeEventListener(eventName, startBackgroundMusic)
      })
      audioManager.stopBgm()
      audioManager.stopAllLoopingSfx()
      hasStartedRef.current = false
    }
  }, [loopingSfxKeys, soundKey])
}
