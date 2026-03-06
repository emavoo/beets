import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { AlbumArt } from '../components/ui/AlbumArt'
import { TrackList } from '../components/library/TrackList'
import { ChevronLeftIcon, PlayIcon, DownloadIcon } from '../components/ui/Icons'
import { usePlayerStore } from '../stores/playerStore'
import { formatDuration } from '../utils/format'
import { downloadTrack } from '../services/offline'

export function AlbumDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const play = usePlayerStore((s) => s.play)

  const albumId = parseInt(id!, 10)

  const album = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => api.getAlbum(albumId),
  })

  const tracks = useQuery({
    queryKey: ['album', albumId, 'tracks'],
    queryFn: async () => {
      const res = await api.getAlbumItems(albumId)
      return res.data.sort((a, b) => {
        if (a.disc !== b.disc) return a.disc - b.disc
        return a.track - b.track
      })
    },
  })

  const totalDuration = tracks.data?.reduce((sum, t) => sum + t.length, 0) ?? 0

  const [downloading, setDownloading] = useState(false)

  const handlePlayAll = () => {
    if (tracks.data && tracks.data.length > 0) {
      play(tracks.data[0], tracks.data, 0)
    }
  }

  const handleDownloadAll = async () => {
    if (!tracks.data || downloading) return
    setDownloading(true)
    try {
      for (const t of tracks.data) {
        await downloadTrack(t)
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="pb-6 animate-fade-in">
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <ChevronLeftIcon size={16} />
          Back
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 px-4 pb-6">
        <AlbumArt albumId={albumId} size="lg" className="shadow-2xl" />
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-text-primary">
            {album.data?.album ?? 'Loading...'}
          </h1>
          <p className="text-text-secondary mt-1">
            {album.data?.albumartist}
          </p>
          <p className="text-sm text-text-tertiary mt-1">
            {album.data?.year != null && album.data.year > 0 && `${album.data.year} \u2022 `}
            {tracks.data && `${tracks.data.length} tracks`}
            {totalDuration > 0 && ` \u2022 ${formatDuration(totalDuration)}`}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePlayAll}
              disabled={!tracks.data?.length}
              className="inline-flex items-center gap-2 px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-full transition-colors disabled:opacity-50"
            >
              <PlayIcon size={16} />
              Play All
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={!tracks.data?.length || downloading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border text-text-secondary hover:text-text-primary text-sm rounded-full transition-colors disabled:opacity-50"
            >
              <DownloadIcon size={16} />
              {downloading ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
      </div>

      {tracks.isLoading ? (
        <div className="flex flex-col gap-1 px-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-overlay rounded animate-pulse" />
          ))}
        </div>
      ) : tracks.data ? (
        <TrackList tracks={tracks.data} showArt={false} />
      ) : null}
    </div>
  )
}
