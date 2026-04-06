import { useState, useRef } from 'react'
import { usePipeline, STAGES } from '../hooks/usePipeline'
import { useSavedLists } from '../hooks/useSavedLists'
import { Plus, GripVertical, Mail, Phone, X, ChevronDown, ArrowRight, Trash2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

const EXCLUDE_FILTERS = [
  { id: 'blomster', label: 'Skjul blomsterbutikker', pattern: /blomster|florist|gartn/i },
]

export default function PipelinePage() {
  const { pipeline, getLeadsForStage, getStageCounts, moveToStage, addListToPipeline, removeFromPipeline } = usePipeline()
  const { lists } = useSavedLists()
  const [dragItem, setDragItem] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilters, setActiveFilters] = useState(new Set())
  const counts = getStageCounts()
  const totalLeads = Object.values(counts).reduce((s, c) => s + c, 0)

  function toggleFilter(filterId) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(filterId) ? next.delete(filterId) : next.add(filterId)
      return next
    })
  }

  function filterLeads(leads) {
    if (activeFilters.size === 0) return leads
    return leads.filter(lead => {
      for (const fId of activeFilters) {
        const f = EXCLUDE_FILTERS.find(ef => ef.id === fId)
        if (f && f.pattern.test(lead.name || '') || f && f.pattern.test(lead.industry || '')) return false
      }
      return true
    })
  }

  function handleDragStart(e, orgNumber, stageId) {
    setDragItem({ orgNumber, fromStage: stageId })
    e.dataTransfer.effectAllowed = 'move'
    e.target.classList.add('dragging')
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging')
    setDragItem(null)
    setDragOverStage(null)
  }

  function handleDragOver(e, stageId) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }

  function handleDragLeave() {
    setDragOverStage(null)
  }

  function handleDrop(e, targetStageId) {
    e.preventDefault()
    setDragOverStage(null)
    if (!dragItem) return
    if (dragItem.fromStage === targetStageId) return
    moveToStage(dragItem.orgNumber, targetStageId)
    const stageName = STAGES.find(s => s.id === targetStageId)?.label
    toast.success(`Flyttet til ${stageName}`)
  }

  function handleImportList(listId) {
    const list = lists.find(l => l.id === listId)
    if (!list) return
    const added = addListToPipeline(list.companies || [])
    setShowImport(false)
    if (added > 0) toast.success(`${added} leads lagt til i pipeline`)
    else toast('Alle leads er allerede i pipeline', { icon: 'ℹ️' })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">
            {totalLeads > 0 ? `${totalLeads} leads i pipeline` : 'Dra leads mellom kolonner for a oppdatere status'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          {EXCLUDE_FILTERS.map(f => (
            <button key={f.id} onClick={() => toggleFilter(f.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.82rem] font-medium border transition-all ${
                activeFilters.has(f.id)
                  ? 'bg-violet/10 border-violet/30 text-violet'
                  : 'border-bdr text-txt-secondary hover:border-violet/20'
              }`}>
              <Filter size={13} /> {f.label}
            </button>
          ))}
          <div className="relative">
          <button onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium text-white hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
            <Plus size={16} /> Importer fra liste
          </button>

          {showImport && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-surface-raised border border-bdr rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-bdr flex items-center justify-between">
                <span className="text-[0.82rem] font-semibold">Velg liste</span>
                <button onClick={() => setShowImport(false)}><X size={14} className="text-txt-tertiary" /></button>
              </div>
              {lists.length === 0 ? (
                <div className="p-4 text-[0.82rem] text-txt-tertiary">Ingen lagrede lister. Sok etter leads forst.</div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {lists.map(l => (
                    <button key={l.id} onClick={() => handleImportList(l.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-sunken transition-colors border-b border-surface-sunken last:border-0">
                      <div>
                        <div className="text-[0.85rem] font-medium">{l.name}</div>
                        <div className="text-[0.72rem] text-txt-tertiary">{l.leadCount} leads</div>
                      </div>
                      <ArrowRight size={14} className="text-txt-tertiary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 h-full min-w-max">
          {STAGES.map((stage) => {
            const leads = filterLeads(getLeadsForStage(stage.id))
            const isOver = dragOverStage === stage.id

            return (
              <div key={stage.id}
                className={`w-[300px] flex flex-col rounded-2xl border transition-all duration-200 ${
                  isOver ? 'border-violet/40 bg-violet/[0.03]' : 'border-bdr bg-surface-sunken/50'
                }`}
                onDragOver={e => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, stage.id)}
              >
                {/* Column header */}
                <div className="p-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stage.emoji}</span>
                    <h3 className="text-[0.88rem] font-semibold">{stage.label}</h3>
                    <span className="text-[0.72rem] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                      {counts[stage.id]}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                  {leads.length === 0 && (
                    <div className="text-center py-8 text-txt-tertiary text-[0.82rem]">
                      {stage.id === 'new' ? 'Importer leads fra en liste' : 'Dra leads hit'}
                    </div>
                  )}

                  {leads.map(lead => (
                    <div
                      key={lead.orgNumber}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.orgNumber, stage.id)}
                      onDragEnd={handleDragEnd}
                      className="kanban-card group bg-surface-raised border border-bdr rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.88rem] font-semibold truncate">{lead.name}</div>
                          <div className="text-[0.72rem] text-txt-tertiary truncate">{lead.industry || 'Ukjent bransje'}</div>
                        </div>
                        <GripVertical size={14} className="text-txt-tertiary/40 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="flex items-center gap-3 text-[0.75rem] text-txt-secondary">
                        {lead.contactName && lead.contactName !== '—' && (
                          <span className="truncate">{lead.contactName}</span>
                        )}
                        {lead.municipality && (
                          <span className="text-txt-tertiary">{lead.municipality}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-surface-sunken">
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded-lg hover:bg-violet/10 text-txt-tertiary hover:text-violet transition-all">
                            <Mail size={13} />
                          </a>
                        )}
                        <button onClick={() => removeFromPipeline(lead.orgNumber)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-400 transition-all ml-auto opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
