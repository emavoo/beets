import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { AlbumArt } from '../components/ui/AlbumArt'
import { usePlayerStore } from '../stores/playerStore'
import type { Album } from '../types'

export function Home() {
  const stats = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
  })

  const recentAlbums = useQuery({
    queryKey: ['albums', 'recent'],
    queryFn: async () => {
      const res = await api.queryAlbums('added-', 1, 12)
      return res.data
    },
  })

  const currentTrack = usePlayerStore((s) => s.currentTrack)

  return (
    <div className="pb-6 animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">Home</h1>
        {stats.data && (
          <p className="text-sm text-text-secondary mt-1">
            {stats.data.items.toLocaleString()} tracks &middot; {stats.data.albums.toLocaleString()} albums
          </p>
        )}
      </div>

      {currentTrack && (
        <section className="px-4 mb-6">
          <Link
            to="/now-playing"
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-accent/10 to-transparent rounded-2xl border border-accent/20 hover:border-accent/40 transition-colors"
          >
            <AlbumArt albumId={currentTrack.album_id} size="md" />
            <div className="min-w-0">
              <p className="text-xs text-accent font-medium uppercase tracking-wider">Now playing</p>
              <p className="text-sm font-medium text-text-primary truncate mt-0.5">{currentTrack.title}</p>
              <p className="text-xs text-text-secondary truncate">{currentTrack.artist}</p>
            </div>
          </Link>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Recently Added</h2>
          <Link to="/albums" className="text-sm text-accent hover:text-accent-hover transition-colors">
            See all
          </Link>
        </div>

        {recentAlbums.isLoading ? (
          <div className="flex gap-4 px-4 overflow-x-auto">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36">
                <div className="w-36 h-36 rounded-lg bg-surface-overlay animate-pulse" />
                <div className="h-3 w-24 bg-surface-overlay rounded mt-2 animate-pulse" />
                <div className="h-2.5 w-16 bg-surface-overlay rounded mt-1 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 px-4 overflow-x-auto pb-2 scrollbar-none">
            {recentAlbums.data?.map((album: Album) => (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="relative overflow-hidden rounded-lg shadow-lg">
                  <AlbumArt albumId={album.id} size="full" className="w-36 h-36" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
                <p className="text-sm font-medium text-text-primary truncate mt-2 px-0.5">
                  {album.album}
                </p>
                <p className="text-xs text-text-secondary truncate px-0.5">
                  {album.albumartist}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
