export interface Item {
  id: number
  title: string
  artist: string
  album: string
  album_id: number
  albumartist: string
  genre: string
  year: number
  track: number
  disc: number
  length: number
  format: string
  bitrate: number
  size: number
  mb_trackid: string
  mb_albumid: string
  mb_artistid: string
  lyrics?: string
  comments?: string
  added: number
}

export interface Album {
  id: number
  album: string
  albumartist: string
  genre: string
  year: number
  mb_albumid: string
  added: number
  items?: Item[]
}

export interface PaginatedResponse<T> {
  items?: T[]
  albums?: T[]
  results?: T[]
  total?: number
}

export interface PlayerState {
  currentTrack: Item | null
  queue: Item[]
  queueIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: 'off' | 'all' | 'one'
}

export interface EQBand {
  frequency: number
  gain: number
  label: string
}

export interface DownloadedTrack {
  itemId: number
  blob: Blob
  item: Item
}
