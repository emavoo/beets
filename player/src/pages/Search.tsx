import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api/client'
import { TrackList } from '../components/library/TrackList'
import { AlbumGrid } from '../components/library/AlbumGrid'
import { SearchBar, getSearchHistory, clearSearchHistory } from '../components/search/SearchBar'
import { XIcon } from '../components/ui/Icons'

type Tab = 'tracks' | 'albums'

export function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const typeParam = searchParams.get('type')
  const [tab, setTab] = useState<Tab>((typeParam as Tab) ?? 'tracks')

  const trackResults = useQuery({
    queryKey: ['search', 'tracks', query],
    queryFn: () => api.queryItems(query, 1, 100),
    enabled: !!query && tab === 'tracks',
  })

  const albumResults = useQuery({
    queryKey: ['search', 'albums', query],
    queryFn: () => api.queryAlbums(query, 1, 100),
    enabled: !!query && tab === 'albums',
  })

  const history = getSearchHistory()

  return (
    <div className="pb-6">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Search</h1>
        <SearchBar />
      </div>

      {query ? (
        <>
          <div className="flex gap-2 px-4 mb-4">
            {(['tracks', 'albums'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  tab === t
                    ? 'bg-accent text-white'
                    : 'bg-surface-overlay text-text-secondary hover:text-text-primary'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === 'tracks' && (
            trackResults.isLoading ? (
              <div className="flex flex-col gap-1 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-14 bg-surface-overlay rounded animate-pulse" />
                ))}
              </div>
            ) : trackResults.data?.data.length ? (
              <TrackList tracks={trackResults.data.data} showAlbum />
            ) : (
              <p className="px-4 py-8 text-center text-text-tertiary">
                No tracks found for &ldquo;{query}&rdquo;
              </p>
            )
          )}

          {tab === 'albums' && (
            albumResults.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="aspect-square rounded-lg bg-surface-overlay animate-pulse" />
                  </div>
                ))}
              </div>
            ) : albumResults.data?.data.length ? (
              <AlbumGrid albums={albumResults.data.data} />
            ) : (
              <p className="px-4 py-8 text-center text-text-tertiary">
                No albums found for &ldquo;{query}&rdquo;
              </p>
            )
          )}
        </>
      ) : history.length > 0 ? (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Recent searches</h2>
            <button
              onClick={clearSearchHistory}
              className="text-xs text-text-tertiary hover:text-error transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <a
                key={h}
                href={`/search?q=${encodeURIComponent(h)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-overlay rounded-full text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                {h}
                <XIcon size={12} className="opacity-50" />
              </a>
            ))}
          </div>
        </div>
      ) : (
        <p className="px-4 py-12 text-center text-text-tertiary">
          Search your music library
        </p>
      )}
    </div>
  )
}
