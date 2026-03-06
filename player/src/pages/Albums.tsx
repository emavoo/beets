import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { AlbumGrid } from '../components/library/AlbumGrid'
import type { Album } from '../types'

export function Albums() {
  const [page, setPage] = useState(1)
  const [allAlbums, setAllAlbums] = useState<Album[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { isLoading } = useQuery({
    queryKey: ['albums', 'all', page],
    queryFn: async () => {
      const res = await api.getAlbums(page, 60)
      const newAlbums = res.data
      setAllAlbums((prev) => (page === 1 ? newAlbums : [...prev, ...newAlbums]))
      if (res.total != null) {
        setHasMore(page * 60 < res.total)
      } else {
        setHasMore(newAlbums.length === 60)
      }
      return newAlbums
    },
  })

  return (
    <div className="pb-6 animate-fade-in">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-text-primary">Albums</h1>
      </div>

      {isLoading && page === 1 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-lg bg-surface-overlay animate-pulse" />
              <div className="h-3 w-3/4 bg-surface-overlay rounded mt-2 animate-pulse" />
              <div className="h-2.5 w-1/2 bg-surface-overlay rounded mt-1 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <AlbumGrid
          albums={allAlbums}
          hasMore={hasMore}
          onLoadMore={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  )
}
