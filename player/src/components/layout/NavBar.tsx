import { NavLink } from 'react-router-dom'
import { HomeIcon, DiscIcon, SearchIcon, SettingsIcon, UploadIcon } from '../ui/Icons'

const links = [
  { to: '/', icon: HomeIcon, label: 'Home' },
  { to: '/albums', icon: DiscIcon, label: 'Albums' },
  { to: '/upload', icon: UploadIcon, label: 'Upload' },
  { to: '/search', icon: SearchIcon, label: 'Search' },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
]

export function NavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                isActive ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
