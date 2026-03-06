import type { Item, Album } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

export interface UploadResult {
  album?: Album & { items?: Item[] }
  items?: Item[]
  errors: { file: string; error: string }[]
}

interface PaginatedResult<T> {
  data: T[]
  total: number | null
}

async function fetchPaginated<T>(
  path: string,
  rootKey: string,
  page?: number,
  perPage = 50,
): Promise<PaginatedResult<T>> {
  const params = page != null ? `?page=${page}&per_page=${perPage}` : ''
  const res = await fetch(`${BASE}${path}${params}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  const total = res.headers.get('X-Total-Count')
  const json = await res.json()
  return {
    data: json[rootKey] ?? [],
    total: total != null ? parseInt(total, 10) : null,
  }
}

export const api = {
  getItems(page?: number, perPage?: number) {
    return fetchPaginated<Item>('/item/', 'items', page, perPage)
  },

  getAlbums(page?: number, perPage?: number) {
    return fetchPaginated<Album>('/album/', 'albums', page, perPage)
  },

  getItem(id: number) {
    return fetchJSON<Item>(`/item/${id}`)
  },

  getAlbum(id: number, expand = false) {
    const q = expand ? '?expand' : ''
    return fetchJSON<Album>(`/album/${id}${q}`)
  },

  getAlbumItems(albumId: number) {
    return fetchPaginated<Item>(
      `/item/query/album_id:${albumId}`,
      'results',
    )
  },

  queryItems(query: string, page?: number, perPage?: number) {
    const encoded = query.split(' ').map(encodeURIComponent).join('/')
    return fetchPaginated<Item>(
      `/item/query/${encoded}`,
      'results',
      page,
      perPage,
    )
  },

  queryAlbums(query: string, page?: number, perPage?: number) {
    const encoded = query.split(' ').map(encodeURIComponent).join('/')
    return fetchPaginated<Album>(
      `/album/query/${encoded}`,
      'results',
      page,
      perPage,
    )
  },

  getArtists() {
    return fetchJSON<{ artist_names: string[] }>('/artist/')
  },

  getStats() {
    return fetchJSON<{ items: number; albums: number }>('/stats')
  },

  getLyrics(itemId: number) {
    return fetchJSON<{ id: number; lyrics: string }>(`/item/${itemId}/lyrics`)
  },

  audioUrl(itemId: number) {
    return `${BASE}/item/${itemId}/file`
  },

  artUrl(albumId: number) {
    return `${BASE}/album/${albumId}/art`
  },

  uploadAlbum(
    files: File[],
    cover?: File,
    onProgress?: (pct: number) => void,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      if (cover) form.append('cover', cover)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BASE}/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText))
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      }

      xhr.onerror = () => reject(new Error('Upload network error'))
      xhr.send(form)
    })
  },
}
