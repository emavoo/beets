import type { Item } from '../types'

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'

interface LastFMConfig {
  apiKey: string
  apiSecret: string
  sessionKey: string
  username: string
}

function getConfig(): LastFMConfig | null {
  const raw = localStorage.getItem('lastfm_config')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveConfig(config: LastFMConfig) {
  localStorage.setItem('lastfm_config', JSON.stringify(config))
}

export function clearConfig() {
  localStorage.removeItem('lastfm_config')
}

export function isConfigured(): boolean {
  return getConfig() !== null
}

export function getUsername(): string | null {
  return getConfig()?.username ?? null
}

async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hash = await crypto.subtle.digest('MD5', data).catch(() => null)
  if (!hash) {
    // Fallback: browser may not support MD5 via SubtleCrypto
    return ''
  }
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function signCall(
  params: Record<string, string>,
  secret: string,
): Promise<string> {
  const keys = Object.keys(params).sort()
  const sig = keys.map((k) => `${k}${params[k]}`).join('') + secret
  return md5(sig)
}

async function callAPI(
  params: Record<string, string>,
  method: 'GET' | 'POST' = 'GET',
): Promise<unknown> {
  const url = new URL(LASTFM_API_URL)
  params.format = 'json'

  if (method === 'GET') {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString())
    return res.json()
  }

  const body = new URLSearchParams(params)
  const res = await fetch(url.toString(), {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.json()
}

export async function getAuthUrl(apiKey: string): Promise<string> {
  return `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(window.location.origin + '/settings')}`
}

export async function getSession(
  apiKey: string,
  apiSecret: string,
  token: string,
): Promise<{ key: string; name: string } | null> {
  const params: Record<string, string> = {
    method: 'auth.getSession',
    api_key: apiKey,
    token,
  }
  params.api_sig = await signCall(params, apiSecret)
  const data = (await callAPI(params)) as {
    session?: { key: string; name: string }
  }
  return data.session ?? null
}

let scrobbleTimer: ReturnType<typeof setTimeout> | null = null
let scrobbleStartTime = 0

export function startScrobbleTracking(track: Item) {
  stopScrobbleTracking()
  scrobbleStartTime = Date.now()

  const scrobbleAt = Math.min(track.length * 0.5, 240) * 1000
  scrobbleTimer = setTimeout(() => {
    scrobble(track)
  }, scrobbleAt)

  updateNowPlaying(track)
}

export function stopScrobbleTracking() {
  if (scrobbleTimer) {
    clearTimeout(scrobbleTimer)
    scrobbleTimer = null
  }
}

async function updateNowPlaying(track: Item) {
  const config = getConfig()
  if (!config) return

  const params: Record<string, string> = {
    method: 'track.updateNowPlaying',
    api_key: config.apiKey,
    sk: config.sessionKey,
    artist: track.artist,
    track: track.title,
    album: track.album,
  }
  if (track.length) params.duration = String(Math.round(track.length))
  params.api_sig = await signCall(params, config.apiSecret)
  callAPI(params, 'POST').catch(() => {})
}

async function scrobble(track: Item) {
  const config = getConfig()
  if (!config) return

  const params: Record<string, string> = {
    method: 'track.scrobble',
    api_key: config.apiKey,
    sk: config.sessionKey,
    'artist[0]': track.artist,
    'track[0]': track.title,
    'album[0]': track.album,
    'timestamp[0]': String(Math.round(scrobbleStartTime / 1000)),
  }
  if (track.length) params['duration[0]'] = String(Math.round(track.length))
  params.api_sig = await signCall(params, config.apiSecret)
  callAPI(params, 'POST').catch(() => {})
}
