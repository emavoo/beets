import { useState } from 'react'
import { api } from '../../api/client'
import { MusicIcon } from './Icons'

interface AlbumArtProps {
  albumId: number | undefined
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const sizeMap = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-48 h-48',
  full: 'w-full aspect-square',
}

export function AlbumArt({ albumId, size = 'md', className = '' }: AlbumArtProps) {
  const [hasError, setHasError] = useState(false)

  if (!albumId || hasError) {
    return (
      <div
        className={`${sizeMap[size]} bg-surface-overlay rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <MusicIcon size={size === 'sm' ? 16 : size === 'md' ? 24 : 48} className="text-text-tertiary" />
      </div>
    )
  }

  return (
    <img
      src={api.artUrl(albumId)}
      alt="Album art"
      loading="lazy"
      onError={() => setHasError(true)}
      className={`${sizeMap[size]} object-cover rounded-lg flex-shrink-0 ${className}`}
    />
  )
}
