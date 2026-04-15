import { useActivityLog } from '../hooks/useActivityLog'
import { Globe, Search, Download, Bookmark, Mail, Zap, Trash2, History, X, AtSign, Phone } from 'lucide-react'

const ICONS = {
  'web-scrape-single': Globe,
  'web-scrape-batch': Globe,
  'search': Search,
  'export-csv': Download,
  'save-list': Bookmark,
  'email-sent': Mail,
  'enrich': Zap,
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now - d) / 60000)
  if (diffMin < 1) return 'Akkurat nå'
  if (diffMin < 60) return `${diffMin} min siden`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} t siden`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay} d siden`
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' })
}

export default function ActivityLogPanel({ onClose }) {
  const { entries, clear } = useActivityLog()

  // Aggregate web-scrape stats — sum of emails/phones/sites across all scrape events
  const scrapeStats = entries.reduce((acc, e) => {
    if (e.type === 'web-scrape-single' || e.type === 'web-scrape-batch') {
      acc.sites += e.meta?.nettsider || (e.type === 'web-scrape-single' ? 1 : 0)
      acc.emails += e.meta?.epost || 0
      acc.phones += e.meta?.telefon || 0
    }
    return acc
  }, { sites: 0, emails: 0, phones: 0 })

  return (
    <div
      className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm flex items-start justify-end p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] h-full max-h-[calc(100vh-2rem)] rounded-xl bg-white border border-gray-200 shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <History size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-[1rem] font-semibold text-gray-900 leading-tight">Aktivitet</h2>
              <p className="text-[0.72rem] text-gray-400">Siste hendelser i appen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Web-scrape summary */}
        {scrapeStats.sites > 0 && (
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="text-[0.68rem] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              Dypsøk — totalt funnet
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Globe size={11} className="text-gray-400" />
                  <span className="text-[0.7rem] text-gray-500">Nettsider</span>
                </div>
                <div className="font-display text-[1.1rem] font-semibold text-gray-900">{scrapeStats.sites}</div>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AtSign size={11} className="text-gray-400" />
                  <span className="text-[0.7rem] text-gray-500">E-poster</span>
                </div>
                <div className="font-display text-[1.1rem] font-semibold text-gray-900">{scrapeStats.emails}</div>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone size={11} className="text-gray-400" />
                  <span className="text-[0.7rem] text-gray-500">Telefon</span>
                </div>
                <div className="font-display text-[1.1rem] font-semibold text-gray-900">{scrapeStats.phones}</div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <History size={18} className="text-gray-300" />
              </div>
              <p className="text-[0.88rem] text-gray-500 font-medium mb-1">Ingen aktivitet enda</p>
              <p className="text-[0.78rem] text-gray-400">
                Når du scraper nettsider, eksporterer eller lagrer lister vil det vises her.
              </p>
            </div>
          ) : (
            <ul className="py-2">
              {entries.map(entry => {
                const Icon = ICONS[entry.type] || History
                return (
                  <li key={entry.id} className="px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.85rem] text-gray-900 leading-snug">{entry.message}</p>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(entry.meta).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.68rem] bg-gray-100 text-gray-600">
                                <span className="text-gray-400 mr-1">{k}</span>
                                <span className="font-medium">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[0.7rem] text-gray-400 mt-1">{formatTime(entry.timestamp)}</p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[0.72rem] text-gray-400">{entries.length} hendelser</span>
            <button
              onClick={() => { if (confirm('Slette all aktivitet?')) clear() }}
              className="flex items-center gap-1.5 text-[0.78rem] text-gray-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={12} /> Tøm logg
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
