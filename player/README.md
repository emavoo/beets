# Beets Player

A cross-platform media player for your [beets](https://beets.io/) music library. Browse, search, and play your collection from any device — runs as a web app and as native iOS/Android apps via Capacitor.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Backend Setup](#backend-setup)
- [Development](#development)
- [Production Build](#production-build)
- [Mobile Builds (Capacitor)](#mobile-builds-capacitor)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Audio Architecture](#audio-architecture)
- [State Management](#state-management)
- [API Client](#api-client)
- [Offline Support](#offline-support)
- [Last.fm Scrobbling](#lastfm-scrobbling)
- [Media Session Integration](#media-session-integration)
- [Theming & Styling](#theming--styling)
- [Routing](#routing)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Features

- **Library Browsing** — Grid view of albums with cover art, artist listing, track lists with infinite scroll
- **Full-text Search** — Real-time search using beets query syntax (`artist:Beatles`, `genre:Rock year:1970..`)
- **Audio Playback** — Full controls (play, pause, skip, seek), queue management, shuffle, repeat (off/all/one)
- **Now Playing** — Full-screen album art, progress bar, lyrics display, volume control
- **5-Band Equalizer** — 60 Hz, 230 Hz, 910 Hz, 4 kHz, 14 kHz via Web Audio API `BiquadFilterNode` chain
- **Offline Downloads** — Download tracks to IndexedDB for offline playback with progress tracking
- **Last.fm Scrobbling** — OAuth authentication, automatic scrobble after 50% or 4 min, now-playing updates
- **Media Session** — Lock screen and notification controls on all platforms (metadata, artwork, seek)
- **Mobile Native** — iOS and Android builds via Capacitor with safe-area insets and status bar theming
- **Dark UI** — Indigo-accented dark theme with smooth transitions and animations

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React SPA (player/)               │
│                                                      │
│  ┌──────────┐  ┌────────────┐  ┌──────────────────┐ │
│  │ Zustand   │  │ TanStack   │  │ Audio Service    │ │
│  │ Store     │  │ Query      │  │ (HTMLAudioElement │ │
│  │ (player)  │  │ (API cache)│  │  + Web Audio API)│ │
│  └──────────┘  └──────┬─────┘  └────────┬─────────┘ │
│                       │                  │           │
└───────────────────────┼──────────────────┼───────────┘
                        │ HTTP/JSON        │ Range requests
                        ▼                  ▼
┌─────────────────────────────────────────────────────┐
│           Beets Web Plugin (Flask REST API)          │
│                                                      │
│  /item/, /album/, /artist/, /stats                   │
│  /item/<id>/file  (audio streaming, conditional)     │
│  /item/<id>/lyrics                                   │
│  /album/<id>/art                                     │
│  ?page=N&per_page=M  (pagination)                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────────────────────┐ │
│  │ Beets Library│  │ Audio Files on Disk           │ │
│  │ (SQLite)     │  │ (FLAC, MP3, AAC, etc.)       │ │
│  └──────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

The player is a single-page React application that communicates with the beets web plugin over HTTP. Audio files are streamed directly from beets using range requests for seeking support. All client state (queue, playback, EQ) lives in a Zustand store; all server state (library data) is cached by TanStack Query.

---

## Prerequisites

- **Python 3.9+** — for running beets and the web server
- **Node.js 18+** — for building the frontend
- **Poetry** (recommended) or **pip** — for installing beets and its Python dependencies
- For mobile builds: **Xcode** (iOS) or **Android Studio** (Android)

---

## Getting Started

### 1. Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

Add it to your PATH (it usually installs to `~/.local/bin`):

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### 2. Install beets and its dependencies

```bash
cd /Users/ema/git/beets/beets
poetry install -E web
```

The `-E web` flag installs the optional web extras (Flask, Flask-CORS) needed for the web plugin.

### 3. Create a beets config file

You need a beets config at `~/.config/beets/config.yaml` with at minimum the web plugin enabled and a library path:

```yaml
plugins: web
directory: ~/Music
library: ~/data/musiclibrary.db
```

### 4. Start the beets web server

```bash
poetry run beet web
```

Or activate the Poetry shell first:

```bash
poetry shell
beet web
```

This starts the API on `http://127.0.0.1:8337`.

### 5. Install frontend dependencies

```bash
cd player
npm install
```

### 6. Start the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies all API calls (`/item/`, `/album/`, `/artist/`, `/stats`) to the beets backend.

### Alternative: Install without Poetry

If you'd rather use pip directly:

```bash
cd /Users/ema/git/beets/beets
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[web]"
beet web
```

---

## Backend Setup

The player relies on a few enhancements to the beets web plugin in `beetsplug/web/__init__.py`:

### Range-Request Audio Streaming

The `item_file` endpoint uses `conditional=True` in `flask.send_file()`, enabling HTTP range requests. This allows the browser to seek within audio files without downloading them entirely.

```python
response = flask.send_file(
    item_path, as_attachment=True, download_name=safe_filename,
    conditional=True,
)
```

### Pagination

List and query endpoints support `?page=N&per_page=M` (default 50 items per page). When pagination is requested, the response includes an `X-Total-Count` header with the total number of results. Endpoints affected:

| Endpoint | Description |
|---|---|
| `GET /item/` | All items (paginated) |
| `GET /item/query/<query>` | Item query results (paginated) |
| `GET /album/` | All albums (paginated) |
| `GET /album/query/<query>` | Album query results (paginated) |

When `page` is omitted, the full result set is returned (backwards-compatible).

### Lyrics Endpoint

```
GET /item/<id>/lyrics
```

Returns `{ "id": <int>, "lyrics": "<string>" }`. Reads from the item's `lyrics` field (populated by the beets `lyrics` plugin).

### Beets Configuration

Ensure your beets `config.yaml` has the `web` plugin enabled. For development on a different origin or device, enable CORS:

```yaml
plugins: web lyrics

web:
  host: 0.0.0.0
  cors: '*'
```

---

## Development

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on port 5173 |
| `npm run build` | TypeScript check + production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

### Dev Server Proxy

The Vite config (`vite.config.ts`) proxies API paths to beets:

```typescript
server: {
  port: 5173,
  proxy: {
    '/item': 'http://127.0.0.1:8337',
    '/album': 'http://127.0.0.1:8337',
    '/artist': 'http://127.0.0.1:8337',
    '/stats': 'http://127.0.0.1:8337',
  },
},
```

To connect to a beets server on a different host, set the `VITE_API_URL` environment variable:

```bash
VITE_API_URL=http://192.168.1.50:8337 npm run dev
```

Or configure the server URL at runtime in **Settings > Server**.

---

## Production Build

```bash
npm run build
```

This produces a static site in `dist/` that can be served by any HTTP server. Point API requests at your beets server by configuring `VITE_API_URL` at build time or by setting the server URL in the app's Settings page.

```bash
npm run preview
```

Serves the production build locally for verification.

---

## Mobile Builds (Capacitor)

The app uses [Capacitor](https://capacitorjs.com/) to wrap the web app into native iOS and Android shells.

### Initial Setup

```bash
# Add iOS platform
npm run cap:init:ios

# Add Android platform
npm run cap:init:android
```

### Build and Open in IDE

```bash
# Build web assets, sync to iOS, open Xcode
npm run cap:ios

# Build web assets, sync to Android, open Android Studio
npm run cap:android
```

### Sync Without Opening

```bash
npm run cap:sync
```

### Capacitor Configuration

The Capacitor config (`capacitor.config.ts`) sets:

- **App ID:** `io.beets.player`
- **App Name:** `Beets Player`
- **Web Directory:** `dist` (Vite build output)
- **Android Scheme:** `https` (required for service workers and Web Audio)
- **Status Bar:** Dark style with `#0a0a0f` background
- **iOS/Android:** Dark background color, mixed content allowed on Android

### Mobile Considerations

- **Safe-area insets** are handled via `env(safe-area-inset-bottom)` in CSS
- **Status bar** theming via `@capacitor/status-bar`
- **Haptic feedback** available via `@capacitor/haptics`
- Audio plays through the device's media channel, supporting background playback via MediaSession

---

## Configuration

Configuration is done through the app's **Settings** page (`/settings`):

| Setting | Storage | Description |
|---|---|---|
| Server URL | `localStorage` | Override the beets API endpoint |
| EQ bands | Zustand (in-memory) | 5-band equalizer gain values (−12 to +12 dB) |
| EQ enabled | Zustand (in-memory) | Toggle equalizer on/off |
| Last.fm API key | `localStorage` | Your Last.fm API application key |
| Last.fm API secret | `localStorage` | Your Last.fm API application secret |
| Last.fm session | `localStorage` | OAuth session (managed automatically) |

Environment variables (build-time):

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `''` (same origin) | Base URL for the beets API |

---

## Project Structure

```
player/
├── capacitor.config.ts          Capacitor native app config
├── eslint.config.js             ESLint config
├── index.html                   HTML entry point
├── package.json                 Dependencies and scripts
├── tsconfig.json                TypeScript project references
├── tsconfig.app.json            App TypeScript config
├── tsconfig.node.json           Node TypeScript config (Vite)
├── vite.config.ts               Vite bundler config with proxy
├── public/
│   └── manifest.json            PWA manifest
└── src/
    ├── main.tsx                 App entry — React root, providers
    ├── App.tsx                  Route definitions
    ├── index.css                Tailwind imports, theme, animations
    ├── api/
    │   └── client.ts            Typed API client for beets web plugin
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.tsx       Shell layout (main area + nav + now playing)
    │   │   └── NavBar.tsx       Bottom navigation bar
    │   ├── library/
    │   │   ├── AlbumGrid.tsx    Responsive album grid with art
    │   │   └── TrackList.tsx    Track listing with play actions
    │   ├── player/
    │   │   └── NowPlayingBar.tsx  Persistent mini player bar
    │   ├── queue/
    │   │   └── QueueList.tsx    Drag-to-reorder queue management
    │   ├── search/
    │   │   └── SearchBar.tsx    Search input with beets query syntax
    │   └── ui/
    │       ├── AlbumArt.tsx     Album artwork with fallback
    │       ├── ErrorBoundary.tsx React error boundary
    │       ├── Icons.tsx        SVG icon components
    │       ├── ProgressSlider.tsx  Seekable progress/volume slider
    │       └── Spinner.tsx      Loading spinner
    ├── hooks/
    │   └── useAudio.ts          Bridges Zustand store ↔ audio service
    ├── pages/
    │   ├── Home.tsx             Recently added, stats, continue listening
    │   ├── Albums.tsx           Album grid with infinite scroll
    │   ├── Artists.tsx          Alphabetical artist list
    │   ├── AlbumDetail.tsx      Album tracks, hero art, play all
    │   ├── Search.tsx           Real-time search results
    │   ├── NowPlaying.tsx       Full-screen player with lyrics
    │   ├── Queue.tsx            Queue management
    │   └── Settings.tsx         Server, EQ, Last.fm, offline
    ├── services/
    │   ├── audio.ts             HTMLAudioElement + Web Audio EQ chain
    │   ├── mediaSession.ts      MediaSession API integration
    │   ├── offline.ts           IndexedDB download manager
    │   └── scrobble.ts          Last.fm API client
    ├── stores/
    │   └── playerStore.ts       Zustand store (queue, playback, EQ)
    ├── types/
    │   └── index.ts             TypeScript interfaces (Item, Album, etc.)
    └── utils/
        └── format.ts            Time, size, bitrate formatters
```

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 19 | UI component library |
| Language | TypeScript | 5.9 | Static typing |
| Bundler | Vite | 7 | Fast HMR, build tooling |
| Styling | Tailwind CSS | 4 | Utility-first CSS with custom theme |
| API State | TanStack Query | 5 | Server state caching, pagination, background refetch |
| Client State | Zustand | 5 | Lightweight store for player state |
| Routing | React Router | 7 | SPA navigation |
| Audio | HTML5 Audio + Web Audio API | — | Playback engine + EQ processing |
| Mobile | Capacitor | 8 | iOS/Android native shell |
| Offline | IndexedDB | — | Track downloads for offline playback |

---

## Audio Architecture

```
HTMLAudioElement
    │
    ▼
MediaElementSourceNode
    │
    ▼
BiquadFilter (60 Hz, peaking, Q=1.4)
    │
    ▼
BiquadFilter (230 Hz, peaking, Q=1.4)
    │
    ▼
BiquadFilter (910 Hz, peaking, Q=1.4)
    │
    ▼
BiquadFilter (4 kHz, peaking, Q=1.4)
    │
    ▼
BiquadFilter (14 kHz, peaking, Q=1.4)
    │
    ▼
GainNode
    │
    ▼
AudioContext.destination (speakers)
```

### How It Works

1. **`HTMLAudioElement`** loads audio from `/item/<id>/file` with range-request support (seeking works natively)
2. The audio element is connected to a **Web Audio API** graph via `createMediaElementSource()`
3. A 5-band **parametric EQ** chain (`BiquadFilterNode` with type `peaking`) processes the signal
4. A **`GainNode`** controls master volume
5. Output goes to `AudioContext.destination`

### Key Behaviors

- The `AudioContext` is created lazily on first user interaction (browser autoplay policy)
- If the context is suspended, it's resumed before playback
- EQ band gains range from −12 dB to +12 dB in 0.5 dB steps
- When EQ is disabled, all filter gains are set to 0 (bypass)
- Track changes trigger `audioElement.src` reassignment + `load()` + `play()`

### Audio Service API (`services/audio.ts`)

| Method | Description |
|---|---|
| `playTrack(itemId)` | Load and play a track by ID |
| `resumePlayback()` | Resume paused playback |
| `pausePlayback()` | Pause current playback |
| `seekTo(time)` | Seek to a position in seconds |
| `setVolume(vol)` | Set volume (0–1) |
| `setEQBand(index, gain)` | Set a specific EQ band's gain in dB |
| `resetEQ()` | Reset all EQ bands to 0 dB |
| `getCurrentTime()` | Get current playback position |
| `getDuration()` | Get track duration |

---

## State Management

### Zustand Store (`stores/playerStore.ts`)

All player state is managed in a single Zustand store:

**State:**

| Field | Type | Description |
|---|---|---|
| `currentTrack` | `Item \| null` | Currently playing track |
| `queue` | `Item[]` | Playback queue |
| `queueIndex` | `number` | Index of current track in queue |
| `isPlaying` | `boolean` | Whether audio is playing |
| `currentTime` | `number` | Current playback position (seconds) |
| `duration` | `number` | Current track duration (seconds) |
| `volume` | `number` | Volume level (0–1) |
| `shuffle` | `boolean` | Shuffle mode |
| `repeat` | `'off' \| 'all' \| 'one'` | Repeat mode |
| `eqBands` | `EQBand[]` | 5 EQ bands with frequency, gain, label |
| `eqEnabled` | `boolean` | Whether EQ is active |

**Actions:**

| Action | Description |
|---|---|
| `play(track, queue?, index?)` | Start playing a track, optionally with a new queue |
| `pause()` / `resume()` / `togglePlay()` | Playback control |
| `next()` / `previous()` | Queue navigation (respects shuffle/repeat) |
| `seekTo(time)` | Update seek position |
| `setVolume(vol)` | Set volume (clamped 0–1) |
| `toggleShuffle()` | Toggle shuffle mode |
| `cycleRepeat()` | Cycle repeat: off → all → one → off |
| `addToQueue(tracks)` | Append tracks to queue |
| `removeFromQueue(index)` | Remove track at index |
| `clearQueue()` | Clear queue and stop playback |
| `moveInQueue(from, to)` | Reorder queue |
| `playFromQueue(index)` | Jump to a queue position |
| `setEQBandGain(index, gain)` | Adjust an EQ band |
| `toggleEQ()` | Enable/disable EQ |

### The `useAudio` Hook

The `useAudio` hook (`hooks/useAudio.ts`) bridges the Zustand store with the audio service. It:

- Watches `currentTrack` changes and calls `audioService.playTrack()`
- Syncs `isPlaying` state with `audioService.resumePlayback()` / `pausePlayback()`
- Applies volume changes to `audioService.setVolume()`
- Applies EQ band gains when bands or enabled state change
- Starts/stops Last.fm scrobble tracking on track changes
- Updates MediaSession metadata and handlers on track changes
- Updates MediaSession position state on time/duration changes

---

## API Client

The typed API client (`api/client.ts`) wraps `fetch` with error handling and pagination support.

### Endpoints

| Method | Endpoint | Returns |
|---|---|---|
| `getItems(page?, perPage?)` | `GET /item/` | Paginated items |
| `getAlbums(page?, perPage?)` | `GET /album/` | Paginated albums |
| `getItem(id)` | `GET /item/<id>` | Single item |
| `getAlbum(id, expand?)` | `GET /album/<id>` | Single album (optionally with tracks) |
| `getAlbumItems(albumId)` | `GET /item/query/album_id:<id>` | Tracks for an album |
| `queryItems(query, page?, perPage?)` | `GET /item/query/<query>` | Search items |
| `queryAlbums(query, page?, perPage?)` | `GET /album/query/<query>` | Search albums |
| `getArtists()` | `GET /artist/` | List of artist names |
| `getStats()` | `GET /stats` | Library item/album counts |
| `getLyrics(itemId)` | `GET /item/<id>/lyrics` | Track lyrics text |
| `audioUrl(itemId)` | `/item/<id>/file` | Direct audio file URL |
| `artUrl(albumId)` | `/album/<id>/art` | Album art image URL |

### Pagination Pattern

Paginated endpoints return `{ data: T[], total: number | null }`. The `total` comes from the `X-Total-Count` response header. When `page` is omitted, all results are returned.

### Base URL

The API base URL is read from `VITE_API_URL` (build-time env var). Falls back to `''` (same origin), which works with the Vite proxy in development. Users can override this at runtime via Settings.

---

## Offline Support

### How It Works

Tracks are downloaded and stored in **IndexedDB** using two object stores:

| Store | Key | Contents |
|---|---|---|
| `tracks` | `itemId` | Audio blob data |
| `meta` | `itemId` | Track metadata (Item fields) |

### Download Process

1. `downloadTrack(item, onProgress?)` fetches audio from `/item/<id>/file`
2. Reads the response body as a stream, reporting progress via callback
3. Stores the blob + metadata in an IndexedDB transaction

### Offline Service API (`services/offline.ts`)

| Function | Description |
|---|---|
| `downloadTrack(item, onProgress?)` | Download a track with progress reporting |
| `getOfflineAudioUrl(itemId)` | Get a `blob:` URL for a downloaded track |
| `isTrackDownloaded(itemId)` | Check if a track is available offline |
| `getOfflineItems()` | Get all downloaded track metadata |
| `removeDownload(itemId)` | Delete a downloaded track |
| `getStorageUsage()` | Get total storage used in bytes |

### Progress Callback

```typescript
type DownloadProgress = {
  itemId: number
  progress: number       // 0–1
  status: 'downloading' | 'done' | 'error'
}
```

---

## Last.fm Scrobbling

### Setup

1. Create a Last.fm API application at https://www.last.fm/api/account/create
2. Enter your API Key and API Secret in **Settings > Last.fm Scrobbling**
3. Click **Connect to Last.fm** — you'll be redirected to authorize the app
4. After authorization, you're redirected back with a session token

### How Scrobbling Works

- On track change, `updateNowPlaying` is sent to Last.fm
- A scrobble timer starts: fires at `min(track_length × 50%, 240s)` (Last.fm rules)
- If the track ends or changes before the timer fires, no scrobble is recorded
- All API calls are signed with your API secret (Last.fm auth spec)

### Scrobble Service API (`services/scrobble.ts`)

| Function | Description |
|---|---|
| `saveConfig(config)` | Persist Last.fm credentials to localStorage |
| `clearConfig()` | Remove Last.fm credentials |
| `isConfigured()` | Check if credentials exist |
| `getUsername()` | Get connected Last.fm username |
| `getAuthUrl(apiKey)` | Generate OAuth authorization URL |
| `getSession(apiKey, secret, token)` | Exchange auth token for session |
| `startScrobbleTracking(track)` | Begin tracking a track for scrobbling |
| `stopScrobbleTracking()` | Stop current scrobble tracking |

---

## Media Session Integration

The `mediaSession` service (`services/mediaSession.ts`) integrates with the [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API) for lock screen and notification controls.

### What It Provides

- **Metadata** — Track title, artist, album, artwork displayed on lock screen / OS notification
- **Action handlers** — Play, pause, next, previous, seek-to
- **Playback state** — Playing / paused / none
- **Position state** — Current position and duration for OS-rendered progress bars

### Platform Support

| Platform | Controls |
|---|---|
| Desktop browsers | Media keys, PiP controls |
| Android (Capacitor) | Notification media controls |
| iOS (Capacitor) | Lock screen / Control Center |

---

## Theming & Styling

### Design System

The app uses **Tailwind CSS v4** with a custom dark theme defined in `src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--color-surface` | `#0a0a0f` | Base background |
| `--color-surface-raised` | `#12121a` | Cards, elevated surfaces |
| `--color-surface-overlay` | `#1a1a25` | Inputs, overlays |
| `--color-surface-hover` | `#222230` | Hover states |
| `--color-border` | `#2a2a3a` | Borders, dividers |
| `--color-text-primary` | `#f0f0f5` | Primary text |
| `--color-text-secondary` | `#8888a0` | Secondary text |
| `--color-text-tertiary` | `#55556a` | Tertiary/disabled text |
| `--color-accent` | `#6366f1` | Indigo accent (buttons, active states) |
| `--color-accent-hover` | `#818cf8` | Accent hover state |
| `--color-accent-glow` | `#6366f140` | Accent glow/shadow (25% opacity) |
| `--color-success` | `#22c55e` | Success indicators |
| `--color-error` | `#ef4444` | Error states, destructive actions |

### Custom Animations

| Class | Animation |
|---|---|
| `.animate-spin-slow` | 8s continuous rotation (vinyl effect) |
| `.animate-fade-in` | 300ms fade + slide up |
| `.animate-slide-up` | 300ms slide up from bottom |

### Typography

System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` with antialiased rendering.

### Responsive Design

- Mobile-first layout with flexbox
- Bottom navigation bar with safe-area padding (`env(safe-area-inset-bottom)`)
- Album grid uses responsive CSS grid
- Now Playing is a full-screen overlay

---

## Routing

Routes are defined in `App.tsx` using React Router v7:

| Path | Page | Layout |
|---|---|---|
| `/` | Home | Standard (nav + now playing bar) |
| `/albums` | Albums | Standard |
| `/artists` | Artists | Standard |
| `/album/:id` | Album Detail | Standard |
| `/search` | Search | Standard |
| `/queue` | Queue | Standard |
| `/settings` | Settings | Standard |
| `/now-playing` | Now Playing | Full-screen (no nav/bar) |

The standard layout (`Layout.tsx`) provides:
- Scrollable main content area
- Persistent `NowPlayingBar` at the bottom (when a track is loaded)
- Bottom `NavBar` for navigation

The Now Playing page lives outside the layout for a full-screen immersive experience.

---

## Error Handling

### Error Boundary

The entire app is wrapped in an `ErrorBoundary` component that catches unhandled React rendering errors and displays a fallback UI.

### API Errors

The API client throws on non-200 responses with a descriptive message: `API <status>: <path>`. TanStack Query handles retries (1 retry by default) and error states per-query.

### Audio Errors

The audio service catches and logs playback errors. The `HTMLAudioElement`'s `error` event is monitored for codec issues, network failures, etc.

### Stale Time

TanStack Query is configured with a 5-minute `staleTime`, reducing unnecessary refetches while keeping data reasonably fresh.

---

## Performance

### Query Caching

TanStack Query caches all API responses. Stale time is set to 5 minutes, and only 1 retry is attempted on failure. This dramatically reduces network requests when navigating between pages.

### Pagination

Large libraries benefit from the pagination support (`?page=N&per_page=M`). The frontend fetches 50 items at a time, and the `X-Total-Count` header informs infinite scroll when there are more pages.

### Lazy Audio Context

The Web Audio API `AudioContext` is created lazily — only when the user first plays a track. This avoids browser autoplay policy warnings and unnecessary resource usage.

### Efficient State Updates

Zustand's selector pattern ensures components only re-render when the specific state they depend on changes. For example, the progress bar subscribes only to `currentTime`, not the entire store.

---

## Accessibility

- **Semantic HTML** — Buttons use `<button>`, links use `<a>`, sections use `<section>`
- **Focus management** — Interactive elements are keyboard-accessible
- **Screen reader support** — Icons have accessible labels via `title` attributes
- **Color contrast** — Text colors meet WCAG AA against the dark background
- **Reduced motion** — Animations are brief (300ms) and use `ease-out` curves

---

## Testing

### Manual Testing Checklist

- [ ] Browse albums, artists, and tracks
- [ ] Search using beets query syntax (e.g., `artist:Beatles`)
- [ ] Play a track from album detail
- [ ] Verify controls: play/pause, next, previous, seek, volume
- [ ] Check shuffle and repeat modes (off, all, one)
- [ ] Open Now Playing full-screen view
- [ ] Toggle lyrics display (requires beets `lyrics` plugin)
- [ ] Adjust EQ bands and toggle EQ on/off
- [ ] Download a track for offline playback
- [ ] Verify offline track appears in Settings storage stats
- [ ] Connect Last.fm and verify scrobbling
- [ ] Test on mobile viewport (responsive layout)
- [ ] Test Capacitor build on iOS/Android simulator
- [ ] Verify Media Session controls on lock screen

### Running Lint

```bash
npm run lint
```

---

## Troubleshooting

### Audio won't play

- **CORS:** If the player and beets run on different origins, configure `web.cors: '*'` in beets config
- **Autoplay policy:** Browsers block autoplay until user interaction. Click the play button rather than expecting auto-start
- **Cross-origin:** The `HTMLAudioElement` uses `crossOrigin = 'anonymous'` — your beets server must send appropriate CORS headers

### Can't connect to beets server

- Verify beets is running: `curl http://127.0.0.1:8337/stats`
- Check the server URL in Settings
- If on a different machine, ensure beets binds to `0.0.0.0`: `web.host: 0.0.0.0`

### EQ has no effect

- The EQ requires the Web Audio API `AudioContext` to be initialized (happens on first play)
- Ensure EQ is toggled **on** in Settings
- Some browsers restrict Web Audio for cross-origin audio; ensure CORS is configured

### Last.fm not scrobbling

- Check that you've completed the OAuth flow (username should appear in Settings)
- Scrobbles fire after 50% of track length or 4 minutes, whichever is shorter
- Verify your API key at https://www.last.fm/api/account

### Mobile build issues

- Run `npm run build` before `npx cap sync`
- Ensure Xcode / Android Studio are up to date
- For iOS: check signing certificates in Xcode
- For Android: `allowMixedContent: true` is set in capacitor config for HTTP beets servers

---

## Contributing

### Code Style

- **TypeScript strict mode** — All types must be explicit or inferred; no `any`
- **Functional components** — All React components are function components with hooks
- **Named exports** — Prefer named exports over default exports (except `App`)
- **Single responsibility** — One component per file, focused on a single concern
- **Zustand selectors** — Always use selector functions to subscribe to specific state slices

### File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `AlbumGrid.tsx`)
- Services/hooks/utils: `camelCase.ts` (e.g., `useAudio.ts`, `audio.ts`)
- Types: `index.ts` in `types/` directory

### Adding a New Page

1. Create the page component in `src/pages/`
2. Add a route in `App.tsx`
3. Optionally add a nav link in `NavBar.tsx`

### Adding a New API Endpoint

1. Add the method to `api/client.ts`
2. Add TypeScript types to `types/index.ts` if needed
3. Use TanStack Query (`useQuery` or `useInfiniteQuery`) in the consuming component

### Adding a New Service

1. Create the service in `src/services/`
2. Keep it framework-agnostic (no React imports)
3. Create a hook in `src/hooks/` if React integration is needed
4. Wire it into `useAudio` or the relevant component
