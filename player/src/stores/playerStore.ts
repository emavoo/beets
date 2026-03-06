import { create } from 'zustand'
import type { Item, EQBand } from '../types'

const DEFAULT_EQ_BANDS: EQBand[] = [
  { frequency: 60, gain: 0, label: '60' },
  { frequency: 230, gain: 0, label: '230' },
  { frequency: 910, gain: 0, label: '910' },
  { frequency: 4000, gain: 0, label: '4k' },
  { frequency: 14000, gain: 0, label: '14k' },
]

interface PlayerStore {
  currentTrack: Item | null
  queue: Item[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: 'off' | 'all' | 'one'
  eqBands: EQBand[]
  eqEnabled: boolean

  play: (track: Item, queue?: Item[], index?: number) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seekTo: (time: number) => void
  setVolume: (vol: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsPlaying: (playing: boolean) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (tracks: Item[]) => void
  removeFromQueue: (index: number) => void
  clearQueue: () => void
  moveInQueue: (from: number, to: number) => void
  playFromQueue: (index: number) => void
  setEQBandGain: (index: number, gain: number) => void
  toggleEQ: () => void
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  shuffle: false,
  repeat: 'off',
  eqBands: DEFAULT_EQ_BANDS,
  eqEnabled: false,

  play: (track, queue, index) => {
    const newQueue = queue ?? [track]
    const newIndex = index ?? (queue ? queue.indexOf(track) : 0)
    set({
      currentTrack: track,
      queue: newQueue,
      queueIndex: newIndex >= 0 ? newIndex : 0,
      isPlaying: true,
      currentTime: 0,
    })
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  togglePlay: () => {
    const { isPlaying, currentTrack } = get()
    if (currentTrack) set({ isPlaying: !isPlaying })
  },

  next: () => {
    const { queue, queueIndex, repeat, shuffle } = get()
    if (queue.length === 0) return

    let nextIndex: number
    if (repeat === 'one') {
      nextIndex = queueIndex
    } else if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0
        else {
          set({ isPlaying: false })
          return
        }
      }
    }

    set({
      currentTrack: queue[nextIndex],
      queueIndex: nextIndex,
      isPlaying: true,
      currentTime: 0,
    })
  },

  previous: () => {
    const { queue, queueIndex, currentTime } = get()
    if (currentTime > 3) {
      set({ currentTime: 0 })
      return
    }
    const prevIndex = Math.max(0, queueIndex - 1)
    set({
      currentTrack: queue[prevIndex],
      queueIndex: prevIndex,
      isPlaying: true,
      currentTime: 0,
    })
  },

  seekTo: (time) => set({ currentTime: time }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off',
    })),

  addToQueue: (tracks) =>
    set((s) => ({ queue: [...s.queue, ...tracks] })),

  removeFromQueue: (index) =>
    set((s) => {
      const queue = [...s.queue]
      queue.splice(index, 1)
      let queueIndex = s.queueIndex
      if (index < queueIndex) queueIndex--
      else if (index === queueIndex && queueIndex >= queue.length) {
        queueIndex = Math.max(0, queue.length - 1)
      }
      return { queue, queueIndex }
    }),

  clearQueue: () => set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false }),

  moveInQueue: (from, to) =>
    set((s) => {
      const queue = [...s.queue]
      const [item] = queue.splice(from, 1)
      queue.splice(to, 0, item)
      let queueIndex = s.queueIndex
      if (s.queueIndex === from) queueIndex = to
      else if (from < s.queueIndex && to >= s.queueIndex) queueIndex--
      else if (from > s.queueIndex && to <= s.queueIndex) queueIndex++
      return { queue, queueIndex }
    }),

  playFromQueue: (index) =>
    set((s) => ({
      currentTrack: s.queue[index],
      queueIndex: index,
      isPlaying: true,
      currentTime: 0,
    })),

  setEQBandGain: (index, gain) =>
    set((s) => {
      const bands = [...s.eqBands]
      bands[index] = { ...bands[index], gain }
      return { eqBands: bands }
    }),

  toggleEQ: () => set((s) => ({ eqEnabled: !s.eqEnabled })),
}))
