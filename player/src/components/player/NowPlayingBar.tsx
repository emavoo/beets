import { usePlayerStore } from '../../stores/playerStore'
import { audioService } from '../../services/audio'
import { AlbumArt } from '../ui/AlbumArt'
import { ProgressSlider } from '../ui/ProgressSlider'
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon } from '../ui/Icons'
import { useNavigate } from 'react-router-dom'
import { formatTime } from '../../utils/format'

export function NowPlayingBar() {
  const track = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const duration = usePlayerStore((s) => s.duration)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const next = usePlayerStore((s) => s.next)
  const previous = usePlayerStore((s) => s.previous)
  const seekTo = usePlayerStore((s) => s.seekTo)
  const navigate = useNavigate()

  if (!track) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-raised/95 backdrop-blur-xl border-t border-border safe-bottom">
      <ProgressSlider
        value={currentTime}
        max={duration}
        onChange={(t) => {
          audioService.seekTo(t)
          seekTo(t)
        }}
        className="absolute -top-3 left-0 right-0 px-2"
      />
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          className="flex items-center gap-3 flex-1 min-w-0 text-left"
          onClick={() => navigate('/now-playing')}
        >
          <AlbumArt albumId={track.album_id} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{track.title}</p>
            <p className="text-xs text-text-secondary truncate">{track.artist}</p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <span className="text-xs text-text-tertiary w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>

          <button
            onClick={(e) => { e.stopPropagation(); previous() }}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <SkipBackIcon size={18} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); togglePlay() }}
            className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-accent hover:bg-accent-hover text-white transition-colors"
          >
            {isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <SkipForwardIcon size={18} />
          </button>

          <span className="text-xs text-text-tertiary w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
