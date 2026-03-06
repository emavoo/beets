import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'
import { NowPlayingBar } from '../player/NowPlayingBar'
import { usePlayerStore } from '../../stores/playerStore'

export function Layout() {
  const hasTrack = usePlayerStore((s) => !!s.currentTrack)

  return (
    <div className="h-full flex flex-col">
      <main className={`flex-1 overflow-y-auto ${hasTrack ? 'pb-32' : 'pb-16'}`}>
        <Outlet />
      </main>
      <NowPlayingBar />
      <NavBar />
    </div>
  )
}
