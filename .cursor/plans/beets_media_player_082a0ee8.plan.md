---
name: Beets Media Player
overview: Build a cross-platform media player (web + iOS + Android) using React + Vite + Capacitor, backed by the existing beets web plugin API with targeted backend enhancements for streaming and pagination.
todos:
  - id: backend-streaming
    content: "Fix audio streaming in web plugin: add `conditional=True` to `send_file` and add pagination support to list endpoints"
    status: completed
  - id: scaffold
    content: "Scaffold the player/ project: Vite + React + TypeScript + Tailwind + React Router + TanStack Query + Zustand"
    status: completed
  - id: api-client
    content: Build typed API client for beets web plugin (items, albums, artists, art, audio URLs)
    status: completed
  - id: library-browse
    content: "Build library browsing screens: Home, Artists, Albums (grid with art), Album Detail (track list), infinite scroll"
    status: completed
  - id: audio-playback
    content: Build audio service (HTMLAudioElement + Web Audio API), NowPlayingBar, full-screen player, queue management, gapless playback
    status: completed
  - id: search
    content: Build search with beets query syntax, real-time results, search history
    status: completed
  - id: eq-lyrics
    content: Add 5-band EQ (Web Audio BiquadFilters), lyrics display on Now Playing screen
    status: completed
  - id: offline
    content: "Add offline support: Workbox service worker, OPFS download manager, offline library view"
    status: completed
  - id: scrobbling
    content: "Add Last.fm scrobbling: OAuth login flow, scrobble tracking, loved tracks"
    status: completed
  - id: capacitor-mobile
    content: "Add Capacitor: configure iOS/Android projects, background audio, media controls, test on devices"
    status: completed
  - id: polish
    content: "Polish: dark/light theme, animations, responsive design, accessibility, error handling"
    status: completed
isProject: false
---

# Beets Media Player

## Architecture

```mermaid
graph TB
    subgraph frontend [React SPA - player/]
        UI[UI Components]
        AudioSvc[Audio Service]
        Store[Zustand Store]
        TQ[TanStack Query]
    end
    subgraph platforms [Platforms]
        Web[Web Browser]
        iOS[iOS via Capacitor]
        Android[Android via Capacitor]
    end
    subgraph backend [Beets Web Plugin]
        API[Flask REST API]
        Lib[Beets Library - SQLite]
        Files[Audio Files on Disk]
    end
    UI --> Store
    UI --> TQ
    Store --> AudioSvc
    TQ -->|HTTP| API
    AudioSvc -->|"Range requests"| API
    API --> Lib
    API --> Files
    frontend --> Web
    frontend --> iOS
    frontend --> Android
```



## Why this stack

- **React + Vite + TypeScript** -- Fast dev loop, huge ecosystem, familiar to most developers
- **Capacitor** -- Wraps the web app into native iOS/Android shells. Unlike React Native, the UI code is identical across platforms (no "web vs native component" split). For a media player where performance-critical work is audio (not UI rendering), WebView-based is the right trade-off
- **Beets web plugin API** -- Already exists, full query syntax, exposes all metadata fields. Two small backend fixes (range requests for streaming, pagination) make it production-ready

## Backend Enhancements (small changes to existing code)

Two targeted changes in `[beetsplug/web/__init__.py](beetsplug/web/__init__.py)`:

**1. Enable range-request audio streaming** (one-line fix)

The current `item_file` endpoint at line 332 uses `flask.send_file()` without `conditional=True`, so browsers can't seek in audio. Fix:

```python
response = flask.send_file(
    item_path, as_attachment=True, download_name=safe_filename, conditional=True
)
```

**2. Add pagination** to item and album list endpoints

Add `?page=N&per_page=M` support (default 50) to `/item/`, `/item/query/`, `/album/`, `/album/query/`. Return `X-Total-Count` header for the frontend to know total results.

**3. Add lyrics endpoint** (if lyrics plugin is active)

`GET /item/<id>/lyrics` -- returns lyrics text from the item's `lyrics` field (populated by the beets lyrics plugin).

## Frontend -- `player/` directory

### Tech Stack


| Layer        | Choice                      | Why                                                               |
| ------------ | --------------------------- | ----------------------------------------------------------------- |
| Framework    | React 19 + TypeScript       | Standard, large ecosystem                                         |
| Bundler      | Vite                        | Fast HMR, great Capacitor integration                             |
| Styling      | Tailwind CSS v4             | Utility-first, responsive, dark mode                              |
| API state    | TanStack Query v5           | Caching, pagination, background refetch                           |
| Client state | Zustand                     | Lightweight, perfect for player state (queue, now-playing)        |
| Routing      | React Router v7             | Standard SPA routing                                              |
| Audio        | HTML5 Audio + Web Audio API | Audio element for playback, Web Audio for EQ                      |
| Mobile       | Capacitor v6                | Native shell for iOS/Android                                      |
| Offline      | Workbox (SW) + OPFS         | Service worker caching + Origin Private File System for downloads |


### Project Structure

```
player/
  src/
    api/           -- API client (typed, wraps fetch)
    components/
      ui/          -- Design system (Button, Card, Slider, etc.)
      player/      -- NowPlayingBar, FullScreenPlayer, Controls, ProgressBar
      library/     -- AlbumGrid, TrackList, ArtistList, AlbumDetail
      search/      -- SearchBar, SearchResults
      queue/       -- QueueList, QueueItem (drag-to-reorder)
    hooks/         -- useAudio, useMediaSession, useOffline, useInfiniteScroll
    pages/         -- Home, Artists, Albums, AlbumDetail, Search, Settings, NowPlaying
    stores/        -- playerStore (queue, current track, playback state, EQ)
    services/
      audio.ts     -- AudioContext + HTMLAudioElement wrapper, EQ chain
      offline.ts   -- Download manager, OPFS storage
      scrobble.ts  -- Last.fm scrobbling (direct API)
    types/         -- Item, Album, Artist, Playlist interfaces
  public/
  index.html
  capacitor.config.ts
  vite.config.ts
  tailwind.config.ts
  package.json
  tsconfig.json
```

### Screens

- **Home** -- Recently added albums, quick stats, continue listening
- **Artists** -- Alphabetical list, tap to see albums
- **Albums** -- Grid with cover art, infinite scroll
- **Album Detail** -- Track list, play all, album art hero
- **Search** -- Real-time search using beets query syntax
- **Now Playing** -- Full-screen album art, controls, progress, lyrics
- **Queue** -- Drag-to-reorder, clear, shuffle
- **Settings** -- Server URL, EQ presets, offline storage, Last.fm login, theme

### Audio Architecture

```mermaid
graph LR
    AudioEl["HTMLAudioElement"] -->|connect| Src[MediaElementSourceNode]
    Src --> EQ1[BiquadFilter 60Hz]
    EQ1 --> EQ2[BiquadFilter 230Hz]
    EQ2 --> EQ3[BiquadFilter 910Hz]
    EQ3 --> EQ4[BiquadFilter 4kHz]
    EQ4 --> EQ5[BiquadFilter 14kHz]
    EQ5 --> Gain[GainNode]
    Gain --> Dest[AudioContext.destination]
```



- `HTMLAudioElement` loads audio from `/item/<id>/file` with range requests (seeking works)
- Web Audio API `BiquadFilterNode` chain provides 5-band EQ
- `MediaSession` API provides lock screen / notification controls on all platforms
- Gapless playback via preloading next track's `AudioElement`

### Offline / Downloads

- **Service Worker** (Workbox) caches API responses and static assets
- **OPFS** (Origin Private File System) stores downloaded audio files
- Download manager in Zustand tracks progress, allows batch album downloads
- Offline library view shows only downloaded content

### Scrobbling

- Direct Last.fm API integration (client-side)
- OAuth flow for Last.fm login
- Scrobble after 50% or 4 minutes of playback (Last.fm rules)

### Development Workflow

- `cd player && npm run dev` -- Vite dev server with HMR, proxies `/item/`, `/album/`, etc. to beets
- `beet web` -- Runs beets API on port 8337
- `cd player && npm run build` -- Production build
- `cd player && npx cap sync && npx cap run ios` -- Build and run on iOS
- `cd player && npx cap sync && npx cap run android` -- Build and run on Android

## Implementation Order

Build incrementally, each phase produces a working player with progressively more features.