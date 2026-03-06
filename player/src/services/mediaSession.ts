import { api } from '../api/client'
import type { Item } from '../types'

export function updateMediaSession(
  track: Item | null,
  handlers: {
    onPlay: () => void
    onPause: () => void
    onNext: () => void
    onPrevious: () => void
    onSeek: (time: number) => void
  },
) {
  if (!('mediaSession' in navigator) || !track) return

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.album_id
      ? [{ src: api.artUrl(track.album_id), sizes: '512x512', type: 'image/jpeg' }]
      : [],
  })

  navigator.mediaSession.setActionHandler('play', handlers.onPlay)
  navigator.mediaSession.setActionHandler('pause', handlers.onPause)
  navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext)
  navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious)
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime != null) handlers.onSeek(details.seekTime)
  })
}

export function setMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = state
  }
}

export function setMediaSessionPosition(position: number, duration: number) {
  if ('mediaSession' in navigator && duration > 0) {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(position, duration),
    })
  }
}
