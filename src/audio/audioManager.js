import { SOUND_FILES } from './soundFiles'

class AudioManager {
  constructor() {
    this.ctx = null
    this.bgmVolume = 0.45
    this.bgmMuted = false
    this.bgmGain = null
    this.bgmSource = null
    this.bgmKey = null
    this.bgmStartPromise = null
    this.bgmStartingKey = null
    this.bgmStartId = 0
    this.sfxVolume = 0.8
    this.sfxMuted = false
    
    this.buffers = new Map()
    this.loopingSfxSources = new Map()
    this.sfxGain = null

    // Start loading and decoding in the background immediately
    this.preloadPromise = this.preloadAll()
  }

  /**
   * Initialize the AudioContext with a fixed sample rate for performance.
   */
  async init() {
    if (this.ctx) return
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    this.ctx = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100,
    })
    
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.connect(this.ctx.destination)
    this.bgmGain = this.ctx.createGain()
    this.bgmGain.connect(this.ctx.destination)
    
    this.updateVolumes()
  }

  async preloadAll() {
    const loaders = Object.entries(SOUND_FILES).map(async ([key, url]) => {
      try {
        const response = await fetch(url)
        const arrayBuffer = await response.arrayBuffer()
        
        if (this.ctx) {
          const buffer = await this.ctx.decodeAudioData(arrayBuffer)
          this.buffers.set(key, buffer)
        } else {
          this.buffers.set(key, arrayBuffer)
        }
      } catch (e) {
        console.error(`Failed to preload ${key}:`, e)
      }
    })
    await Promise.all(loaders)
  }

  async decodeBuffer(key) {
    if (!this.ctx) await this.init()
    let data = this.buffers.get(key)
    if (!data && this.preloadPromise) {
      await this.preloadPromise
      data = this.buffers.get(key)
    }
    if (!data) return null
    if (data instanceof AudioBuffer) return data
    
    try {
      const buffer = await this.ctx.decodeAudioData(data.slice(0))
      this.buffers.set(key, buffer)
      return buffer
    } catch (e) {
      console.error(`Error decoding ${key}:`, e)
      return null
    }
  }

  async unlock() {
    await this.init()
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }
    
    for (const key of this.buffers.keys()) {
      this.decodeBuffer(key)
    }
  }

  updateVolumes() {
    if (!this.ctx) return
    const now = this.ctx.currentTime
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxMuted ? 0 : this.sfxVolume, now, 0.1)
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(this.bgmMuted ? 0 : this.bgmVolume, now, 0.1)
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
  }

  setSfxMuted(isMuted) {
    this.sfxMuted = isMuted
    this.updateVolumes()
  }

  setBgmVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume))
    this.updateVolumes()
  }

  setBgmMuted(isMuted) {
    this.bgmMuted = isMuted
    this.updateVolumes()
  }

  async playBgm(soundKey) {
    await this.unlock()
    if (this.bgmSource && this.bgmKey === soundKey) return true
    if (this.bgmStartPromise && this.bgmStartingKey === soundKey) {
      return this.bgmStartPromise
    }

    const startId = this.bgmStartId + 1
    this.bgmStartId = startId
    this.stopCurrentBgm()

    this.bgmStartingKey = soundKey
    this.bgmStartPromise = (async () => {
      const buffer = await this.decodeBuffer(soundKey)
      if (!buffer || this.bgmStartId !== startId) return false

      const source = this.ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true

      source.connect(this.bgmGain)
      if (this.bgmStartId !== startId) {
        source.disconnect()
        return false
      }

      source.start(0)
      this.bgmSource = source
      this.bgmKey = soundKey
      return true
    })()

    try {
      return await this.bgmStartPromise
    } finally {
      if (this.bgmStartId === startId) {
        this.bgmStartPromise = null
        this.bgmStartingKey = null
      }
    }
  }

  stopBgm() {
    this.bgmStartId += 1
    this.bgmStartPromise = null
    this.bgmStartingKey = null
    this.stopCurrentBgm()
  }

  stopCurrentBgm() {
    if (!this.bgmSource) return

    try { this.bgmSource.stop() } catch {
      // The source may already be stopped by the browser.
    }
    this.bgmSource = null
    this.bgmKey = null
  }

  async playSfx(soundKey, options = {}) {
    await this.unlock()
    const buffer = await this.decodeBuffer(soundKey)
    if (!buffer) return

    const { volume = 1, playbackRate = 1 } = options
    const source = this.ctx.createBufferSource()
    const gain = this.ctx.createGain()
    
    source.buffer = buffer
    source.playbackRate.setTargetAtTime(playbackRate, this.ctx.currentTime, 0.01)
    gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01)
    
    source.connect(gain)
    gain.connect(this.sfxGain)
    source.start(0)
  }

  async playLoopingSfx(soundKey) {
    await this.unlock()
    if (this.loopingSfxSources.has(soundKey)) return

    const buffer = await this.decodeBuffer(soundKey)
    if (!buffer) return

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    
    source.connect(this.sfxGain)
    source.start(0)
    this.loopingSfxSources.set(soundKey, source)
  }

  stopLoopingSfx(soundKey) {
    const source = this.loopingSfxSources.get(soundKey)
    if (source) {
      try { source.stop() } catch {
        // The source may already be stopped by the browser.
      }
      this.loopingSfxSources.delete(soundKey)
    }
  }

  stopAllLoopingSfx() {
    this.loopingSfxSources.forEach((source) => {
      try { source.stop() } catch {
        // The source may already be stopped by the browser.
      }
    })
    this.loopingSfxSources.clear()
  }
}

const audioManager = new AudioManager()
export default audioManager
