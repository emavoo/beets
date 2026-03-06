import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { audioService } from '../services/audio'
import { updateMediaSession, setMediaSessionPlaybackState, setMediaSessionPosition } from '../services/mediaSession'
import { startScrobbleTracking, stopScrobbleTracking, isConfigured } from '../services/scrobble'

export function useAudio() {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const eqBands = usePlayerStore((s) => s.eqBands)
  const eqEnabled = usePlayerStore((s) => s.eqEnabled)

  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const resume = usePlayerStore((s) => s.resume)
  const pause = usePlayerStore((s) => s.pause)
  const seekTo = usePlayerStore((s) => s.seekTo)

  const prevTrackId = useRef<number | null>(null)

  useEffect(() => {
    if (!currentTrack) return
    if (currentTrack.id === prevTrackId.current) return
    prevTrackId.current = currentTrack.id

    audioService.playTrack(currentTrack.id)

    if (isConfigured()) {
      startScrobbleTracking(currentTrack)
    }

    updateMediaSession(currentTrack, {
      onPlay: resume,
      onPause: pause,
      onNext: next,
      onPrevious: previous,
      onSeek: (t) => {
        audioService.seekTo(t)
        seekTo(t)
      },
    })

    return () => {
      stopScrobbleTracking()
    }
  }, [currentTrack, resume, pause, next, previous, seekTo])

  useEffect(() => {
    if (!currentTrack) return
    if (isPlaying) {
      audioService.resumePlayback()
      setMediaSessionPlaybackState('playing')
    } else {
      audioService.pausePlayback()
      setMediaSessionPlaybackState('paused')
    }
  }, [isPlaying, currentTrack])

  useEffect(() => {
    audioService.setVolume(volume)
  }, [volume])

  useEffect(() => {
    setMediaSessionPosition(currentTime, duration)
  }, [currentTime, duration])

  useEffect(() => {
    eqBands.forEach((band, i) => {
      audioService.setEQBand(i, eqEnabled ? band.gain : 0)
    })
  }, [eqBands, eqEnabled])
}
