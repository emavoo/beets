import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Home } from './pages/Home'
import { Albums } from './pages/Albums'
import { Artists } from './pages/Artists'
import { AlbumDetail } from './pages/AlbumDetail'
import { Search } from './pages/Search'
import { NowPlaying } from './pages/NowPlaying'
import { Queue } from './pages/Queue'
import { Settings } from './pages/Settings'
import { Upload } from './pages/Upload'
import { useAudio } from './hooks/useAudio'

export default function App() {
  useAudio()

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/upload" element={<Upload />} />
        </Route>
        <Route path="/now-playing" element={<NowPlaying />} />
      </Routes>
    </ErrorBoundary>
  )
}
