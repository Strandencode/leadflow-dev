import { useState, useRef } from 'react'
import { usePipeline, STAGES } from '../hooks/usePipeline'
import { useSavedLists } from '../hooks/useSavedLists'
import { usePlan } from '../hooks/usePlan'
import { UpgradePrompt } from '../components/UpgradePrompt'
import { Plus, GripVertical, Mail, Phone, X, ChevronDown, ArrowRight, Trash2, Filter, Check, StickyNote, Send, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const EXCLUDE_FILTERS = [
  { id: 'blomster', label: 'Skjul blomsterbutikker', pattern: /blomster|florist|gartn/i },
]

export default function PipelinePage() {
  const { pipeline, getLeadsForStage, getStageCounts, moveToStage, addListToPipeline, removeFromPipeline, addNote, removeNote } = usePipeline()
  const { lists } = useSavedLists()
  const { canAddToPipeline, limits } = usePlan()
  const [dragItem, setDragItem] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [activeFilters, setActiveFilters] = useState(new Set())
  const [selectedLeads, setSelectedLeads] = useState(new Set())
  const [showBulkMove, setShowBulkMove] = useState(false)
  const [expandedCard, setExpandedCard] = useState(null) // orgNumber
  const [noteText, setNoteText] = useState('')

  function toggleSelectLead(orgNumber, e) {
    e.stopPropagation()
    setSelectedLeads(prev => {
      const next = new Set(prev)
      next.has(orgNumber) ? next.delete(orgNumber) : next.add(orgNumber)
      return next
    })
  }

  function bulkMoveToStage(targetStageId) {
    if (!selectedLeads.size) return
    selectedLeads.forEach(orgNumber => moveToStage(orgNumber, targetStageId))
    const stageName = STAGES.find(s => s.id === targetStageId)?.label
    toast.success(`${selectedLeads.size} leads flyttet til ${stageName}`)
    setSelectedLeads(new Set())
    setShowBulkMove(false)
  }

  function bulkRemove() {
    if (!selectedLeads.size) return
    selectedLeads.forEach(orgNumber => removeFromPipeline(orgNumber))
    toast.success(`${selectedLeads.size} leads fjernet`)
    setSelectedLeads(new Set())
  }

  function selectAllInStage(stageId) {
    const leads = getLeadsForStage(stageId)
    setSelectedLeads(prev => {
      const next = new Set(prev)
      const allSelected = leads.every(l => next.has(l.orgNumber))
      leads.forEach(l => allSelected ? next.delete(l.orgNumber) : next.add(l.orgNumber))
      return next
    })
  }
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
    if (!canAddToPipeline(totalLeads)) {
      toast.error(`Pipeline-grensen er nådd (${limits.pipelineLeads} leads). Oppgrader for flere.`)
      setShowImport(false)
      return
    }
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
            {totalLeads > 0 ? `${totalLeads}${limits.pipelineLeads !== Infinity ? `/${limits.pipelineLeads}` : ''} leads i pipeline` : 'Dra leads mellom kolonner for å oppdatere status'}
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

      {/* Pipeline limit banner */}
      {!canAddToPipeline(totalLeads) && (
        <div className="mx-6 mt-2">
          <UpgradePrompt feature={`Pipeline-grensen nådd (${limits.pipelineLeads} leads)`} planNeeded="Professional" inline />
        </div>
      )}

      {/* Bulk action bar */}
      {selectedLeads.size > 0 && (
        <div className="mx-6 mt-2 bg-ink text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-lg animate-in">
          <span className="text-[0.88rem] font-medium">✓ {selectedLeads.size} valgt</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowBulkMove(!showBulkMove)} className="px-3 py-1.5 rounded-lg text-[0.82rem] font-medium bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1.5">
                <ArrowRight size={13}/> Flytt til...
              </button>
              {showBulkMove && (
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-surface-raised text-txt-primary border border-bdr rounded-xl shadow-xl z-50 overflow-hidden">
                  {STAGES.map(s => (
                    <button key={s.id} onClick={() => bulkMoveToStage(s.id)} className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-[0.82rem] hover:bg-surface-sunken transition-colors">
                      <span>{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={bulkRemove} className="px-3 py-1.5 rounded-lg text-[0.82rem] font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all flex items-center gap-1.5">
              <Trash2 size={13}/> Fjern
            </button>
            <button onClick={() => setSelectedLeads(new Set())} className="px-2 py-1.5 text-white/50 hover:text-white transition-all">✕</button>
          </div>
        </div>
      )}

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
                      {leads.length}
                    </span>
                  </div>
                  {leads.length > 0 && (
                    <button onClick={() => selectAllInStage(stage.id)} className="p-1.5 rounded-lg hover:bg-surface-sunken text-txt-tertiary hover:text-violet transition-all" title="Velg alle">
                      <Check size={14}/>
                    </button>
                  )}
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
                      className={`kanban-card group bg-surface-raised border rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${selectedLeads.has(lead.orgNumber) ? 'border-violet ring-1 ring-violet/30' : 'border-bdr'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <input type="checkbox" checked={selectedLeads.has(lead.orgNumber)} onChange={e => toggleSelectLead(lead.orgNumber, e)} className="accent-violet w-3.5 h-3.5 mt-0.5 cursor-pointer flex-shrink-0"/>
                          <div className="min-w-0">
                            <div className="text-[0.88rem] font-semibold truncate">{lead.name}</div>
                            <div className="text-[0.72rem] text-txt-tertiary truncate">{lead.industry || 'Ukjent bransje'}</div>
                          </div>
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
                        <button onClick={(e) => { e.stopPropagation(); setExpandedCard(expandedCard === lead.orgNumber ? null : lead.orgNumber); setNoteText('') }}
                          className={`p-1.5 rounded-lg transition-all ${expandedCard === lead.orgNumber ? 'bg-violet/10 text-violet' : 'text-txt-tertiary hover:bg-violet/10 hover:text-violet'}`} title="Notater">
                          <StickyNote size={13} />
                        </button>
                        {(lead.notes || []).length > 0 && expandedCard !== lead.orgNumber && (
                          <span className="text-[0.62rem] text-txt-tertiary">{lead.notes.length}</span>
                        )}
                        <button onClick={() => removeFromPipeline(lead.orgNumber)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-400 transition-all ml-auto opacity-0 group-hover:opacity-100">
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Expandable notes section */}
                      {expandedCard === lead.orgNumber && (
                        <div className="mt-2 pt-2 border-t border-surface-sunken" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5 mb-2">
                            <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Legg til notat..." className="flex-1 px-2.5 py-1.5 bg-surface border border-bdr rounded-lg text-[0.75rem] outline-none focus:border-violet" onKeyDown={e => { if (e.key === 'Enter' && noteText.trim()) { addNote(lead.orgNumber, noteText); setNoteText(''); toast.success('Notat lagt til') }}}/>
                            <button onClick={() => { if (noteText.trim()) { addNote(lead.orgNumber, noteText); setNoteText(''); toast.success('Notat lagt til') }}} disabled={!noteText.trim()} className="p-1.5 rounded-lg bg-violet text-white disabled:opacity-30 hover:bg-violet/90 transition-all">
                              <Send size={11}/>
                            </button>
                          </div>
                          {(lead.notes || []).length > 0 && (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                              {[...(lead.notes || [])].reverse().map(note => (
                                <div key={note.id} className="p-2 bg-surface-sunken/50 rounded-lg group/note">
                                  <p className="text-[0.72rem] text-txt-secondary">{note.text}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-[0.6rem] text-txt-tertiary">{new Date(note.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}</span>
                                    <button onClick={() => removeNote(lead.orgNumber, note.id)} className="text-txt-tertiary hover:text-red-400 opacity-0 group-hover/note:opacity-100 transition-all"><X size={10}/></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
