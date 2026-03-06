import { usePlayerStore } from '../../stores/playerStore'
import { AlbumArt } from '../ui/AlbumArt'
import { XIcon, PlayIcon, PauseIcon } from '../ui/Icons'
import { formatTime } from '../../utils/format'

export function QueueList() {
  const queue = usePlayerStore((s) => s.queue)
  const queueIndex = usePlayerStore((s) => s.queueIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const playFromQueue = usePlayerStore((s) => s.playFromQueue)
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue)
  const clearQueue = usePlayerStore((s) => s.clearQueue)
  const togglePlay = usePlayerStore((s) => s.togglePlay)

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
        <p className="text-lg">Queue is empty</p>
        <p className="text-sm mt-1">Play something to get started</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-sm text-text-secondary">{queue.length} tracks</p>
        <button
          onClick={clearQueue}
          className="text-xs text-error hover:text-error/80 transition-colors"
        >
          Clear queue
        </button>
      </div>

      <div className="flex flex-col">
        {queue.map((track, i) => {
          const isCurrent = i === queueIndex

          return (
            <div
              key={`${track.id}-${i}`}
              className={`flex items-center gap-3 px-4 py-2.5 group ${
                isCurrent ? 'bg-surface-overlay' : 'hover:bg-surface-hover'
              } transition-colors`}
            >
              <button
                onClick={() => {
                  if (isCurrent) togglePlay()
                  else playFromQueue(i)
                }}
                className="relative flex-shrink-0"
              >
                <AlbumArt albumId={track.album_id} size="sm" />
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isCurrent && isPlaying ? (
                    <PauseIcon size={14} className="text-white" />
                  ) : (
                    <PlayIcon size={14} className="text-white" />
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${
                  isCurrent ? 'text-accent font-medium' : 'text-text-primary'
                }`}>
                  {track.title}
                </p>
                <p className="text-xs text-text-secondary truncate">{track.artist}</p>
              </div>

              <span className="text-xs text-text-tertiary tabular-nums">
                {formatTime(track.length)}
              </span>

              <button
                onClick={() => removeFromQueue(i)}
                className="p-1 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all"
              >
                <XIcon size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
