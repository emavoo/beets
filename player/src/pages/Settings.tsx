import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePlayerStore } from '../stores/playerStore'
import { ChevronLeftIcon } from '../components/ui/Icons'
import {
  isConfigured as isLastFMConfigured,
  getUsername,
  saveConfig,
  clearConfig,
  getAuthUrl,
  getSession,
} from '../services/scrobble'
import {
  getStorageUsage,
  getOfflineItems,
} from '../services/offline'
import { formatSize } from '../utils/format'

export function Settings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eqBands = usePlayerStore((s) => s.eqBands)
  const eqEnabled = usePlayerStore((s) => s.eqEnabled)
  const setEQBandGain = usePlayerStore((s) => s.setEQBandGain)
  const toggleEQ = usePlayerStore((s) => s.toggleEQ)

  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem('beets_server_url') ?? '',
  )
  const [lastfmKey, setLastfmKey] = useState(
    () => localStorage.getItem('lastfm_api_key') ?? '',
  )
  const [lastfmSecret, setLastfmSecret] = useState(
    () => localStorage.getItem('lastfm_api_secret') ?? '',
  )
  const [lastfmConnected, setLastfmConnected] = useState(isLastFMConfigured)
  const [lastfmUsername, setLastfmUsername] = useState(getUsername)
  const [storageUsage, setStorageUsage] = useState(0)
  const [offlineCount, setOfflineCount] = useState(0)

  useEffect(() => {
    getStorageUsage().then(setStorageUsage)
    getOfflineItems().then((items) => setOfflineCount(items.length))
  }, [])

  useEffect(() => {
    const token = searchParams.get('token')
    if (token && lastfmKey && lastfmSecret) {
      getSession(lastfmKey, lastfmSecret, token).then((session) => {
        if (session) {
          saveConfig({
            apiKey: lastfmKey,
            apiSecret: lastfmSecret,
            sessionKey: session.key,
            username: session.name,
          })
          setLastfmConnected(true)
          setLastfmUsername(session.name)
        }
      })
    }
  }, [searchParams, lastfmKey, lastfmSecret])

  const handleSaveServer = () => {
    localStorage.setItem('beets_server_url', serverUrl)
    window.location.reload()
  }

  const handleConnectLastFM = async () => {
    if (!lastfmKey) return
    localStorage.setItem('lastfm_api_key', lastfmKey)
    localStorage.setItem('lastfm_api_secret', lastfmSecret)
    const url = await getAuthUrl(lastfmKey)
    window.location.href = url
  }

  const handleDisconnectLastFM = () => {
    clearConfig()
    setLastfmConnected(false)
    setLastfmUsername(null)
  }

  return (
    <div className="pb-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      {/* Server */}
      <Section title="Server">
        <label className="block text-sm text-text-secondary mb-1">Beets server URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://127.0.0.1:8337"
            className="flex-1 px-3 py-2 bg-surface-overlay border border-border rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent"
          />
          <button
            onClick={handleSaveServer}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </Section>

      {/* EQ */}
      <Section title="Equalizer">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-secondary">Enable EQ</span>
          <button
            onClick={toggleEQ}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              eqEnabled ? 'bg-accent' : 'bg-surface-overlay'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                eqEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {eqBands.map((band, i) => (
            <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1">
              <input
                type="range"
                min={-12}
                max={12}
                step={0.5}
                value={band.gain}
                onChange={(e) => setEQBandGain(i, parseFloat(e.target.value))}
                disabled={!eqEnabled}
                className="h-24 -rotate-0 accent-accent disabled:opacity-30"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
              <span className="text-xs text-text-tertiary">{band.label}</span>
              <span className="text-xs text-text-secondary tabular-nums">
                {band.gain > 0 ? '+' : ''}{band.gain}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Last.fm */}
      <Section title="Last.fm Scrobbling">
        {lastfmConnected ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-primary">Connected as <strong>{lastfmUsername}</strong></p>
              <p className="text-xs text-text-secondary mt-0.5">Tracks will be scrobbled automatically</p>
            </div>
            <button
              onClick={handleDisconnectLastFM}
              className="px-3 py-1.5 text-sm text-error border border-error/30 rounded-lg hover:bg-error/10 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-text-secondary mb-1">API Key</label>
              <input
                type="text"
                value={lastfmKey}
                onChange={(e) => setLastfmKey(e.target.value)}
                className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">API Secret</label>
              <input
                type="password"
                value={lastfmSecret}
                onChange={(e) => setLastfmSecret(e.target.value)}
                className="w-full px-3 py-2 bg-surface-overlay border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleConnectLastFM}
              disabled={!lastfmKey}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              Connect to Last.fm
            </button>
          </div>
        )}
      </Section>

      {/* Offline */}
      <Section title="Offline Storage">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-primary">{offlineCount} tracks downloaded</p>
            <p className="text-xs text-text-secondary mt-0.5">{formatSize(storageUsage)} used</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 py-4 border-b border-border">
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </section>
  )
}
