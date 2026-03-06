import { Link } from 'react-router-dom'
import type { Album } from '../../types'
import { AlbumArt } from '../ui/AlbumArt'

interface AlbumGridProps {
  albums: Album[]
  onLoadMore?: () => void
  hasMore?: boolean
}

export function AlbumGrid({ albums, onLoadMore, hasMore }: AlbumGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {albums.map((album) => (
          <Link
            key={album.id}
            to={`/album/${album.id}`}
            className="group flex flex-col gap-2"
          >
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              <AlbumArt albumId={album.id} size="full" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            <div className="min-w-0 px-0.5">
              <p className="text-sm font-medium text-text-primary truncate">
                {album.album}
              </p>
              <p className="text-xs text-text-secondary truncate">
                {album.albumartist}
                {album.year > 0 && ` \u2022 ${album.year}`}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 text-sm text-accent hover:text-accent-hover bg-surface-overlay rounded-full transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}
