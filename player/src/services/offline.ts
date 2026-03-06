import { api } from '../api/client'
import type { Item } from '../types'

const DB_NAME = 'beets-player-offline'
const DB_VERSION = 1
const STORE_TRACKS = 'tracks'
const STORE_META = 'meta'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'itemId' })
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'itemId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export type DownloadProgress = {
  itemId: number
  progress: number
  status: 'downloading' | 'done' | 'error'
}

type ProgressCallback = (p: DownloadProgress) => void

export async function downloadTrack(
  item: Item,
  onProgress?: ProgressCallback,
): Promise<void> {
  const db = await openDB()

  try {
    onProgress?.({ itemId: item.id, progress: 0, status: 'downloading' })

    const res = await fetch(api.audioUrl(item.id))
    if (!res.ok) throw new Error(`Download failed: ${res.status}`)

    const contentLength = parseInt(res.headers.get('Content-Length') ?? '0', 10)
    const reader = res.body!.getReader()
    const chunks: Uint8Array[] = []
    let loaded = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      if (contentLength > 0) {
        onProgress?.({
          itemId: item.id,
          progress: loaded / contentLength,
          status: 'downloading',
        })
      }
    }

    const blob = new Blob(chunks as BlobPart[])

    const tx = db.transaction([STORE_TRACKS, STORE_META], 'readwrite')
    tx.objectStore(STORE_TRACKS).put({ itemId: item.id, blob })
    tx.objectStore(STORE_META).put({ itemId: item.id, ...item })

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    onProgress?.({ itemId: item.id, progress: 1, status: 'done' })
  } catch (e) {
    onProgress?.({ itemId: item.id, progress: 0, status: 'error' })
    throw e
  }
}

export async function getOfflineAudioUrl(itemId: number): Promise<string | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRACKS, 'readonly')
    const req = tx.objectStore(STORE_TRACKS).get(itemId)
    req.onsuccess = () => {
      if (req.result?.blob) {
        resolve(URL.createObjectURL(req.result.blob))
      } else {
        resolve(null)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

export async function isTrackDownloaded(itemId: number): Promise<boolean> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_META, 'readonly')
    const req = tx.objectStore(STORE_META).get(itemId)
    req.onsuccess = () => resolve(!!req.result)
    req.onerror = () => resolve(false)
  })
}

export async function getOfflineItems(): Promise<Item[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly')
    const req = tx.objectStore(STORE_META).getAll()
    req.onsuccess = () => resolve(req.result ?? [])
    req.onerror = () => reject(req.error)
  })
}

export async function removeDownload(itemId: number): Promise<void> {
  const db = await openDB()
  const tx = db.transaction([STORE_TRACKS, STORE_META], 'readwrite')
  tx.objectStore(STORE_TRACKS).delete(itemId)
  tx.objectStore(STORE_META).delete(itemId)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getStorageUsage(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_TRACKS, 'readonly')
    const req = tx.objectStore(STORE_TRACKS).getAll()
    req.onsuccess = () => {
      const total = (req.result ?? []).reduce(
        (acc: number, r: { blob: Blob }) => acc + (r.blob?.size ?? 0),
        0,
      )
      resolve(total)
    }
    req.onerror = () => resolve(0)
  })
}
