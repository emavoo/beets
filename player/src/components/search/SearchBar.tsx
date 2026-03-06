import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon, XIcon } from '../ui/Icons'

export function SearchBar() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
      saveToHistory(trimmed)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search artists, albums, tracks..."
        className="w-full pl-10 pr-10 py-2.5 bg-surface-overlay border border-border rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(''); inputRef.current?.focus() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
        >
          <XIcon size={16} />
        </button>
      )}
    </form>
  )
}

function saveToHistory(query: string) {
  try {
    const raw = localStorage.getItem('search_history')
    const history: string[] = raw ? JSON.parse(raw) : []
    const updated = [query, ...history.filter((h) => h !== query)].slice(0, 20)
    localStorage.setItem('search_history', JSON.stringify(updated))
  } catch { /* ignore */ }
}

export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem('search_history')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearSearchHistory() {
  localStorage.removeItem('search_history')
}
