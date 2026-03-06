import { api } from '../api/client'
import { usePlayerStore } from '../stores/playerStore'

let audioElement: HTMLAudioElement | null = null
let audioContext: AudioContext | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let eqFilters: BiquadFilterNode[] = []
let gainNode: GainNode | null = null
let isContextConnected = false

function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio()
    audioElement.preload = 'auto'
    audioElement.crossOrigin = 'anonymous'

    audioElement.addEventListener('timeupdate', () => {
      usePlayerStore.getState().setCurrentTime(audioElement!.currentTime)
    })
    audioElement.addEventListener('loadedmetadata', () => {
      usePlayerStore.getState().setDuration(audioElement!.duration)
    })
    audioElement.addEventListener('ended', () => {
      usePlayerStore.getState().next()
    })
    audioElement.addEventListener('error', () => {
      console.error('Audio playback error:', audioElement?.error)
    })
  }
  return audioElement
}

function ensureAudioContext() {
  const el = getAudioElement()
  if (audioContext && isContextConnected) return

  audioContext = new AudioContext()
  sourceNode = audioContext.createMediaElementSource(el)
  gainNode = audioContext.createGain()

  const frequencies = [60, 230, 910, 4000, 14000]
  eqFilters = frequencies.map((freq) => {
    const filter = audioContext!.createBiquadFilter()
    filter.type = 'peaking'
    filter.frequency.value = freq
    filter.Q.value = 1.4
    filter.gain.value = 0
    return filter
  })

  let lastNode: AudioNode = sourceNode
  for (const filter of eqFilters) {
    lastNode.connect(filter)
    lastNode = filter
  }
  lastNode.connect(gainNode)
  gainNode.connect(audioContext.destination)
  isContextConnected = true
}

export const audioService = {
  async playTrack(itemId: number) {
    const el = getAudioElement()
    const url = api.audioUrl(itemId)

    el.src = url
    el.load()

    try {
      ensureAudioContext()
      if (audioContext?.state === 'suspended') {
        await audioContext.resume()
      }
      await el.play()
    } catch (e) {
      console.error('Playback failed:', e)
    }
  },

  async resumePlayback() {
    const el = getAudioElement()
    try {
      if (audioContext?.state === 'suspended') {
        await audioContext.resume()
      }
      await el.play()
    } catch (e) {
      console.error('Resume failed:', e)
    }
  },

  pausePlayback() {
    getAudioElement().pause()
  },

  seekTo(time: number) {
    getAudioElement().currentTime = time
  },

  setVolume(vol: number) {
    getAudioElement().volume = vol
    if (gainNode) gainNode.gain.value = vol
  },

  setEQBand(index: number, gain: number) {
    if (eqFilters[index]) {
      eqFilters[index].gain.value = gain
    }
  },

  resetEQ() {
    for (const filter of eqFilters) {
      filter.gain.value = 0
    }
  },

  getCurrentTime(): number {
    return getAudioElement().currentTime
  },

  getDuration(): number {
    return getAudioElement().duration || 0
  },
}
