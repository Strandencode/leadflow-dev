import { useState } from 'react'
import { History } from 'lucide-react'
import { useActivityLog } from '../hooks/useActivityLog'
import ActivityLogPanel from './ActivityLogPanel'

/**
 * Floating activity-log button, pinned top-right of the main content area.
 * Rendered once in the protected layout so it follows every page.
 */
export default function ActivityLogButton() {
  const [open, setOpen] = useState(false)
  const { entries } = useActivityLog()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Aktivitetslogg"
        className="fixed top-4 right-5 z-[55] w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
      >
        <History size={16} />
        {entries.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gray-900 ring-2 ring-white" />
        )}
      </button>
      {open && <ActivityLogPanel onClose={() => setOpen(false)} />}
    </>
  )
}
