import type { Item } from '../../types'
import { usePlayerStore } from '../../stores/playerStore'
import { AlbumArt } from '../ui/AlbumArt'
import { PlayIcon, PauseIcon } from '../ui/Icons'
import { formatTime } from '../../utils/format'

interface TrackListProps {
  tracks: Item[]
  showArt?: boolean
  showAlbum?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

export function TrackList({
  tracks,
  showArt = true,
  showAlbum = false,
  onLoadMore,
  hasMore,
}: TrackListProps) {
  const play = usePlayerStore((s) => s.play)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  return (
    <div className="flex flex-col">
      {tracks.map((track, i) => {
        const isCurrent = currentTrack?.id === track.id

        return (
          <button
            key={track.id}
            onClick={() => {
              if (isCurrent) togglePlay()
              else play(track, tracks, i)
            }}
            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors text-left group ${
              isCurrent ? 'bg-surface-overlay' : ''
            }`}
          >
            {showArt ? (
              <div className="relative flex-shrink-0">
                <AlbumArt albumId={track.album_id} size="sm" />
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCurrent && isPlaying ? (
                    <PauseIcon size={16} className="text-white" />
                  ) : (
                    <PlayIcon size={16} className="text-white" />
                  )}
                </div>
              </div>
            ) : (
              <span className={`w-6 text-right text-xs tabular-nums flex-shrink-0 ${
                isCurrent ? 'text-accent' : 'text-text-tertiary'
              }`}>
                {isCurrent && isPlaying ? (
                  <span className="inline-flex gap-0.5">
                    <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-3 bg-accent rounded-full animate-pulse delay-150" />
                  </span>
                ) : (
                  track.track || i + 1
                )}
              </span>
            )}

            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${
                isCurrent ? 'text-accent font-medium' : 'text-text-primary'
              }`}>
                {track.title}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {track.artist}
                {showAlbum && track.album && ` \u2014 ${track.album}`}
              </p>
            </div>

            <span className="text-xs text-text-tertiary tabular-nums flex-shrink-0">
              {formatTime(track.length)}
            </span>
          </button>
        )
      })}

      {hasMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          className="py-4 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Load more...
        </button>
      )}
    </div>
  )
}
