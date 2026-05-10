import { SOUND_FILES } from './soundFiles'

class AudioManager {
  constructor() {
    this.musicVolume = 0.35
    this.sfxVolume = 0.8
    this.musicMuted = false
    this.sfxMuted = false
    this.currentBgm = null
    this.loopingSfx = new Map()
  }

  createAudio(soundKey) {
    const source = SOUND_FILES[soundKey]
    if (!source) {
      console.warn(`Unknown sound key: ${soundKey}`)
      return null
    }

    return new Audio(source)
  }

  async playBgm(soundKey) {
    if (this.currentBgm) {
      this.stopBgm()
    }

    const track = this.createAudio(soundKey)
    if (!track) {
      return
    }

    track.loop = true
    track.volume = this.musicMuted ? 0 : this.musicVolume
    this.currentBgm = track

    try {
      await track.play()
    } catch (error) {
      console.warn('Unable to play BGM:', error)
    }
  }

  stopBgm() {
    if (!this.currentBgm) {
      return
    }

    this.currentBgm.pause()
    this.currentBgm.currentTime = 0
    this.currentBgm = null
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.currentBgm && !this.musicMuted) {
      this.currentBgm.volume = this.musicVolume
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.loopingSfx.forEach((effect) => {
      effect.volume = this.sfxMuted ? 0 : this.sfxVolume
    })
  }

  setMusicMuted(isMuted) {
    this.musicMuted = isMuted
    if (this.currentBgm) {
      this.currentBgm.volume = isMuted ? 0 : this.musicVolume
    }
  }

  setSfxMuted(isMuted) {
    this.sfxMuted = isMuted
    this.loopingSfx.forEach((effect) => {
      effect.volume = isMuted ? 0 : this.sfxVolume
    })
  }

  playSfx(soundKey, options = {}) {
    const effect = this.createAudio(soundKey)
    if (!effect || this.sfxMuted) {
      return
    }

    const { volume = 1, playbackRate = 1 } = options
    effect.volume = Math.max(0, Math.min(1, this.sfxVolume * volume))
    effect.playbackRate = playbackRate
    effect.play().catch((error) => {
      console.warn('Unable to play SFX:', error)
    })
  }

  async playLoopingSfx(soundKey) {
    if (this.loopingSfx.has(soundKey)) {
      return
    }

    const effect = this.createAudio(soundKey)
    if (!effect) {
      return
    }

    effect.loop = true
    effect.volume = this.sfxMuted ? 0 : this.sfxVolume
    this.loopingSfx.set(soundKey, effect)

    try {
      await effect.play()
    } catch (error) {
      console.warn('Unable to play looping SFX:', error)
      this.loopingSfx.delete(soundKey)
    }
  }

  stopLoopingSfx(soundKey) {
    const effect = this.loopingSfx.get(soundKey)
    if (!effect) {
      return
    }

    effect.pause()
    effect.currentTime = 0
    this.loopingSfx.delete(soundKey)
  }

  stopAllLoopingSfx() {
    this.loopingSfx.forEach((effect, soundKey) => {
      effect.pause()
      effect.currentTime = 0
      this.loopingSfx.delete(soundKey)
    })
  }
}

const audioManager = new AudioManager()

export default audioManager
