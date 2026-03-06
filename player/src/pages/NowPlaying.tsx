import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usePlayerStore } from '../stores/playerStore'
import { audioService } from '../services/audio'
import { api } from '../api/client'
import { AlbumArt } from '../components/ui/AlbumArt'
import { ProgressSlider } from '../components/ui/ProgressSlider'
import {
  PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon,
  ShuffleIcon, RepeatIcon, Repeat1Icon,
  VolumeIcon, VolumeMuteIcon, ChevronLeftIcon,
  ListMusicIcon, SlidersIcon,
} from '../components/ui/Icons'
import { formatTime } from '../utils/format'

export function NowPlaying() {
  const navigate = useNavigate()
  const track = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const volume = usePlayerStore((s) => s.volume)
  const shuffle = usePlayerStore((s) => s.shuffle)
  const repeat = usePlayerStore((s) => s.repeat)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const seekTo = usePlayerStore((s) => s.seekTo)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle)
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat)

  const [showLyrics, setShowLyrics] = useState(false)

  const lyrics = useQuery({
    queryKey: ['lyrics', track?.id],
    queryFn: () => api.getLyrics(track!.id),
    enabled: !!track && showLyrics,
  })

  if (!track) {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        <p>Nothing playing</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-surface-raised to-surface">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <p className="text-xs text-text-tertiary uppercase tracking-widest font-medium">
          Now Playing
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setShowLyrics(!showLyrics)}
            className={`p-2 transition-colors ${
              showLyrics ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Lyrics"
          >
            <span className="text-xs font-bold">Aa</span>
          </button>
          <button
            onClick={() => navigate('/queue')}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="Queue"
          >
            <ListMusicIcon size={20} />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            title="EQ"
          >
            <SlidersIcon size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 min-h-0">
        {showLyrics && lyrics.data?.lyrics ? (
          <div className="w-full max-w-md h-full overflow-y-auto py-4 scrollbar-none">
            <pre className="text-sm text-text-secondary whitespace-pre-wrap font-sans leading-relaxed text-center">
              {lyrics.data.lyrics}
            </pre>
          </div>
        ) : (
          <div className="w-full max-w-xs">
            <AlbumArt
              albumId={track.album_id}
              size="full"
              className="rounded-2xl shadow-2xl shadow-accent-glow"
            />
          </div>
        )}
      </div>

      <div className="px-8 pb-2">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-text-primary truncate">{track.title}</h2>
          <p className="text-sm text-text-secondary truncate">{track.artist} &mdash; {track.album}</p>
        </div>

        <ProgressSlider
          value={currentTime}
          max={duration}
          onChange={(t) => {
            audioService.seekTo(t)
            seekTo(t)
          }}
        />
        <div className="flex justify-between mt-1 mb-4">
          <span className="text-xs text-text-tertiary tabular-nums">{formatTime(currentTime)}</span>
          <span className="text-xs text-text-tertiary tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              shuffle ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <ShuffleIcon size={20} />
          </button>

          <button
            onClick={previous}
            className="p-3 text-text-primary hover:text-accent transition-colors"
          >
            <SkipBackIcon size={24} />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white transition-colors shadow-lg shadow-accent-glow"
          >
            {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
          </button>

          <button
            onClick={next}
            className="p-3 text-text-primary hover:text-accent transition-colors"
          >
            <SkipForwardIcon size={24} />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2 transition-colors ${
              repeat !== 'off' ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {repeat === 'one' ? <Repeat1Icon size={20} /> : <RepeatIcon size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 1)}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {volume === 0 ? <VolumeMuteIcon size={18} /> : <VolumeIcon size={18} />}
          </button>
          <ProgressSlider
            value={volume}
            max={1}
            onChange={setVolume}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}
