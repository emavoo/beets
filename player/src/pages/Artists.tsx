import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { UsersIcon } from '../components/ui/Icons'

export function Artists() {
  const { data, isLoading } = useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const res = await api.getArtists()
      return res.artist_names.filter(Boolean).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      )
    },
  })

  const grouped = groupByLetter(data ?? [])

  return (
    <div className="pb-6 animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">Artists</h1>
        {data && (
          <p className="text-sm text-text-secondary mt-1">{data.length} artists</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2 px-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-12 bg-surface-overlay rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div>
          {Object.entries(grouped).map(([letter, artists]) => (
            <div key={letter}>
              <div className="sticky top-0 z-10 px-4 py-1.5 bg-surface/90 backdrop-blur-sm">
                <span className="text-xs font-bold text-accent uppercase">{letter}</span>
              </div>
              {artists.map((name) => (
                <Link
                  key={name}
                  to={`/search?q=${encodeURIComponent(`albumartist:${name}`)}&type=albums`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-overlay flex items-center justify-center flex-shrink-0">
                    <UsersIcon size={18} className="text-text-tertiary" />
                  </div>
                  <span className="text-sm text-text-primary truncate">{name}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByLetter(names: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const name of names) {
    const first = name[0]?.toUpperCase() ?? '#'
    const letter = /[A-Z]/.test(first) ? first : '#'
    if (!groups[letter]) groups[letter] = []
    groups[letter].push(name)
  }
  return groups
}
