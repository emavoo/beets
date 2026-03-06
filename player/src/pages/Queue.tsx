import { useNavigate } from 'react-router-dom'
import { QueueList } from '../components/queue/QueueList'
import { ChevronLeftIcon } from '../components/ui/Icons'

export function Queue() {
  const navigate = useNavigate()

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Queue</h1>
      </div>
      <QueueList />
    </div>
  )
}
