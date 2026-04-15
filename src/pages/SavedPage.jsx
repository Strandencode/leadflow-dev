import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Download, BookmarkX, ChevronDown, ChevronRight, Mail, Trophy, Phone as PhoneIcon, Check, X, Lock } from 'lucide-react'
import { useSavedLists } from '../hooks/useSavedLists'
import { usePipeline } from '../hooks/usePipeline'
import { useCustomers } from '../hooks/useCustomers'
import { usePlan } from '../hooks/usePlan'
import { UpgradePrompt } from '../components/UpgradePrompt'
import EmailComposerModal from '../components/EmailComposerModal'
import toast from 'react-hot-toast'

const COLORS = ['bg-coral-glow text-coral','bg-violet-soft text-violet','bg-teal-soft text-teal','bg-amber-100 text-amber-600','bg-blue-50 text-blue-600','bg-pink-50 text-pink-600','bg-emerald-50 text-emerald-600','bg-indigo-50 text-indigo-600']

function buildGmailUrl(c) {
  const n = c.contactName && c.contactName !== '—' ? c.contactName : ''
  return `https://mail.google.com/mail/?view=cm&to=${c.email||''}&su=${encodeURIComponent('Hei '+n+' — en henvendelse fra oss')}&body=${encodeURIComponent('Hei '+n+',\n\nJeg tar kontakt angående '+c.name+'.\n\nVennlig hilsen')}`
}
function buildOutlookUrl(c) {
  const n = c.contactName && c.contactName !== '—' ? c.contactName : ''
  return `https://outlook.office.com/mail/deeplink/compose?to=${c.email||''}&subject=${encodeURIComponent('Hei '+n+' — en henvendelse fra oss')}&body=${encodeURIComponent('Hei '+n+',\n\nJeg tar kontakt angående '+c.name+'.\n\nVennlig hilsen')}`
}

export default function SavedPage() {
  const navigate = useNavigate()
  const { lists, deleteList, markEmailed: _markEmailed, markCalled: _markCalled, getTracking } = useSavedLists()
  const { autoAdvanceToContacted } = usePipeline()
  const { addCustomer, isCustomer } = useCustomers()
  const { canExportCSV, canSaveList, limits } = usePlan()

  // Wrap to auto-advance pipeline
  function markEmailed(orgNumber, value = true) {
    _markEmailed(orgNumber, value)
    if (value) autoAdvanceToContacted(orgNumber)
  }
  function markCalled(orgNumber, value) {
    _markCalled(orgNumber, value)
    if (value) autoAdvanceToContacted(orgNumber)
  }
  const [expandedId, setExpandedId] = useState(null)
  const [visibleCount, setVisibleCount] = useState({})
  const [selectedRows, setSelectedRows] = useState({})
  const [composerList, setComposerList] = useState(null)
  const [listSearch, setListSearch] = useState({}) // { [listId]: searchString }
  const [listFilter, setListFilter] = useState({}) // { [listId]: 'all'|'emailed'|'not_emailed'|'called'|'not_contacted' }

  function fmt(iso) { return iso ? new Date(iso).toLocaleDateString('nb-NO',{day:'numeric',month:'short',year:'numeric'}) : '—' }

  function getSelected(listId) { return selectedRows[listId] || new Set() }
  function setSelected(listId, s) { setSelectedRows(prev => ({...prev, [listId]: s})) }

  function toggleRow(listId, orgNum) {
    const s = new Set(getSelected(listId))
    s.has(orgNum) ? s.delete(orgNum) : s.add(orgNum)
    setSelected(listId, s)
  }

  function selectAllOnList(list) {
    const sel = getSelected(list.id)
    if (sel.size === list.companies.length) { setSelected(list.id, new Set()) }
    else { setSelected(list.id, new Set(list.companies.map(c=>c.orgNumber))) }
  }

  function selectAllWithEmail(list) {
    const withEmail = list.companies.filter(c=>c.email).map(c=>c.orgNumber)
    setSelected(list.id, new Set(withEmail))
    toast.success(`${withEmail.length} med e-post valgt`)
  }

  function openBulkGmail(list) {
    const sel = getSelected(list.id)
    const targets = list.companies.filter(c => sel.has(c.orgNumber) && c.email)
    if (!targets.length) { toast.error('Ingen valgte har e-post'); return }
    const batch = targets.slice(0, 10)
    batch.forEach(c => { window.open(buildGmailUrl(c),'_blank'); markEmailed(c.orgNumber) })
    if (targets.length > 10) toast(`Åpnet 10 av ${targets.length}`,{icon:'⚠️'})
    else toast.success(`Åpnet ${batch.length} e-poster i Gmail`)
  }

  function openBulkOutlook(list) {
    const sel = getSelected(list.id)
    const targets = list.companies.filter(c => sel.has(c.orgNumber) && c.email)
    if (!targets.length) { toast.error('Ingen valgte har e-post'); return }
    const batch = targets.slice(0, 10)
    batch.forEach(c => { window.open(buildOutlookUrl(c),'_blank'); markEmailed(c.orgNumber) })
    if (targets.length > 10) toast(`Åpnet 10 av ${targets.length}`,{icon:'⚠️'})
    else toast.success(`Åpnet ${batch.length} e-poster i Outlook`)
  }

  function handleExportList(list, e) {
    e.stopPropagation()
    if (!canExportCSV) { toast.error('CSV-eksport krever Professional eller høyere'); return }
    if (!list.companies?.length) return
    const h = ['Org Nr','Navn','Bransje','Adresse','Kommune','Kontakt','Rolle','E-post','Telefon','Sendt e-post','Ringt']
    const csv = [h.join(';'), ...list.companies.map(c => {
      const t = getTracking(c.orgNumber)
      return [c.orgNumber,c.name,c.industry,c.address,c.municipality,c.contactName||'',c.contactRole||'',c.email||'',c.phone||'',t.emailed?fmt(t.emailedAt):'',t.called?fmt(t.calledAt):''].map(v=>`"${v}"`).join(';')
    })].join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url
    a.download = `leadflow-${list.name.toLowerCase().replace(/\s+/g,'-')}.csv`; a.click(); URL.revokeObjectURL(url)
    toast.success(`Eksporterte "${list.name}" med kontaktstatus`)
  }

  async function handleDelete(list, e) {
    e.stopPropagation()
    await deleteList(list.id)
    toast.success(`"${list.name}" slettet`)
    if (expandedId === list.id) setExpandedId(null)
  }

  // Stats per list
  function listStats(list) {
    let emailed = 0, called = 0, won = 0
    for (const c of list.companies || []) {
      const t = getTracking(c.orgNumber)
      if (t.emailed) emailed++
      if (t.called) called++
      if (isCustomer(c.orgNumber)) won++
    }
    return { emailed, called, won, withEmail: list.companies.filter(c=>c.email).length, withPhone: list.companies.filter(c=>c.phone).length }
  }

  return (
    <div>
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Lagrede lister</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">
            {lists.length > 0 ? `${lists.length}${limits.savedLists !== Infinity ? `/${limits.savedLists}` : ''} lister — ${lists.reduce((s,l)=>s+l.leadCount,0)} leads totalt` : 'Dine lagrede søk'}
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* List limit banner */}
        {!canSaveList(lists.length) && (
          <div className="mb-6">
            <UpgradePrompt feature={`Du har brukt alle ${limits.savedLists} listeplasser`} planNeeded="Professional" inline />
          </div>
        )}
        {lists.length === 0 ? (
          <div className="text-center py-20">
            <BookmarkX size={48} className="mx-auto text-txt-tertiary/40 mb-4"/>
            <h3 className="font-display text-lg font-semibold text-txt-secondary mb-2">Ingen lagrede lister enda</h3>
            <p className="text-txt-tertiary text-[0.9rem] mb-6 max-w-sm mx-auto">Kjør et søk og klikk "Lagre liste".</p>
            <button onClick={()=>navigate('/search')} className="px-5 py-2.5 bg-coral text-white rounded-lg font-medium hover:bg-coral-hover transition-all">Finn leads →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list, i) => {
              const sel = getSelected(list.id)
              const st = listStats(list)
              const selWithEmail = sel.size > 0 ? list.companies.filter(c=>sel.has(c.orgNumber)&&c.email).length : 0

              return (
                <div key={list.id} className="animate-in bg-surface-raised border border-bdr rounded-xl overflow-hidden" style={{animationDelay:`${i*0.05}s`}}>
                  {/* Header */}
                  <div className="p-6 cursor-pointer flex items-center gap-4" onClick={()=>setExpandedId(expandedId===list.id?null:list.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-display text-[1.05rem] font-semibold">{list.name}</h3>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.75rem] font-medium ${COLORS[i%COLORS.length]}`}>{list.leadCount} leads</span>
                      </div>
                      <p className="text-[0.82rem] text-txt-secondary">{list.filterLabels}</p>
                      {/* Mini stats */}
                      <div className="flex gap-3 mt-2 text-[0.75rem]">
                        <span className="text-violet font-medium">✉ {st.emailed} sendt</span>
                        <span className="text-teal font-medium">📱 {st.called} ringt</span>
                        <span className="text-green-600 font-medium">🏆 {st.won} won</span>
                        <span className="text-txt-tertiary">{st.withEmail} har e-post · {st.withPhone} har tlf</span>
                      </div>
                    </div>

                    <span className="text-[0.78rem] text-txt-tertiary whitespace-nowrap">{fmt(list.createdAt)}</span>

                    <div className="flex gap-1">
                      <button onClick={e=>handleExportList(list,e)} className={`p-2 rounded-lg hover:bg-surface-sunken text-txt-tertiary hover:text-txt-primary transition-all ${!canExportCSV ? 'opacity-40' : ''}`} title={canExportCSV ? 'CSV' : 'Krever Professional'}>{canExportCSV ? <Download size={16}/> : <Lock size={16}/>}</button>
                      <button onClick={e=>handleDelete(list,e)} className="p-2 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-500 transition-all" title="Slett"><Trash2 size={16}/></button>
                    </div>

                    {expandedId===list.id ? <ChevronDown size={16} className="text-txt-tertiary"/> : <ChevronRight size={16} className="text-txt-tertiary"/>}
                  </div>

                  {/* Selection bar */}
                  {expandedId===list.id && sel.size > 0 && (
                    <div className="bg-ink text-white px-5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[0.85rem] font-medium">✓ {sel.size} valgt</span>
                        <span className="text-white/30">|</span>
                        <span className="text-[0.8rem] text-white/60">{selWithEmail} med e-post</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>selectAllWithEmail(list)} className="px-3 py-1 rounded-lg text-[0.78rem] font-medium bg-white/10 hover:bg-white/20 transition-all">Velg alle med e-post ({st.withEmail})</button>
                        <span className="text-white/20">|</span>
                        <button onClick={()=>setComposerList(list.id)} disabled={!selWithEmail} className="flex items-center gap-1.5 px-4 py-1 rounded-lg text-[0.8rem] font-semibold bg-coral hover:bg-coral-hover disabled:opacity-40 transition-all"><Mail size={13}/> Send e-post ({selWithEmail})</button>
                        <button onClick={()=>setSelected(list.id,new Set())} className="px-2 py-1 text-white/50 hover:text-white transition-all">✕</button>
                      </div>
                    </div>
                  )}

                  {/* Expanded table */}
                  {expandedId===list.id && list.companies?.length > 0 && (()=>{
                    const q = (listSearch[list.id] || '').toLowerCase()
                    const flt = listFilter[list.id] || 'all'
                    const filteredCompanies = list.companies.filter(c => {
                      // Text search
                      if (q && !`${c.name} ${c.contactName} ${c.email} ${c.industry} ${c.municipality}`.toLowerCase().includes(q)) return false
                      // Status filter
                      const t = getTracking(c.orgNumber)
                      if (flt === 'emailed' && !t.emailed) return false
                      if (flt === 'not_emailed' && t.emailed) return false
                      if (flt === 'called' && !t.called) return false
                      if (flt === 'not_contacted' && (t.emailed || t.called)) return false
                      if (flt === 'has_email' && !c.email) return false
                      return true
                    })
                    return (
                    <div className="border-t border-bdr">
                      {/* Quick actions bar */}
                      <div className="px-4 py-2.5 bg-surface-sunken flex items-center gap-2 text-[0.78rem] flex-wrap">
                        <input type="text" value={listSearch[list.id]||''} onChange={e=>setListSearch(p=>({...p,[list.id]:e.target.value}))} placeholder="Søk i listen..." className="px-2.5 py-1.5 bg-surface border border-bdr rounded-lg text-[0.78rem] outline-none focus:border-violet w-44"/>
                        {[
                          {id:'all',label:'Alle'},
                          {id:'not_contacted',label:'Ikke kontaktet'},
                          {id:'emailed',label:'Sendt'},
                          {id:'not_emailed',label:'Ikke sendt'},
                          {id:'called',label:'Ringt'},
                          {id:'has_email',label:'Har e-post'},
                        ].map(f=>(
                          <button key={f.id} onClick={()=>setListFilter(p=>({...p,[list.id]:f.id}))} className={`px-2.5 py-1 rounded border transition-all font-medium ${flt===f.id?'border-violet text-violet bg-violet/5':'border-bdr text-txt-secondary hover:border-violet/30'}`}>{f.label}</button>
                        ))}
                        <span className="text-txt-tertiary ml-auto">{filteredCompanies.length} av {list.companies.length}</span>
                        <button onClick={()=>selectAllOnList(list)} className="px-2.5 py-1 rounded border border-bdr text-txt-secondary hover:border-violet hover:text-violet transition-all font-medium">
                          {sel.size===list.companies.length ? 'Fjern markering' : 'Velg alle'}
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-surface-sunken/50">
                            <tr>
                              <th className="text-left px-4 py-2 w-9"><input type="checkbox" checked={sel.size===list.companies.length&&list.companies.length>0} onChange={()=>selectAllOnList(list)} className="accent-coral w-4 h-4 cursor-pointer"/></th>
                              <th className="text-left px-4 py-2 text-[0.7rem] uppercase tracking-wider text-txt-tertiary font-semibold">Selskap</th>
                              <th className="text-left px-4 py-2 text-[0.7rem] uppercase tracking-wider text-txt-tertiary font-semibold">Kontakt</th>
                              <th className="text-left px-4 py-2 text-[0.7rem] uppercase tracking-wider text-txt-tertiary font-semibold">E-post / Tlf</th>
                              <th className="text-left px-4 py-2 text-[0.7rem] uppercase tracking-wider text-txt-tertiary font-semibold">Sendt / Ringt</th>
                              <th className="text-left px-4 py-2 text-[0.7rem] uppercase tracking-wider text-txt-tertiary font-semibold">Handlinger</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCompanies.slice(0, visibleCount[list.id]||20).map(c => {
                              const t = getTracking(c.orgNumber)
                              const isWon = isCustomer(c.orgNumber)
                              return (
                                <tr key={c.orgNumber} className={`border-b border-surface-sunken last:border-0 hover:bg-surface/30 transition-colors ${isWon?'bg-green-50/30':''}`}>
                                  <td className="px-4 py-2.5"><input type="checkbox" checked={sel.has(c.orgNumber)} onChange={()=>toggleRow(list.id,c.orgNumber)} className="accent-coral w-4 h-4 cursor-pointer"/></td>
                                  <td className="px-4 py-2.5">
                                    <div className="font-medium text-[0.85rem]">{c.name}</div>
                                    <div className="text-[0.72rem] text-txt-tertiary">{c.industry}</div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="text-[0.82rem]">{c.contactName||'—'}</div>
                                    <div className="text-[0.72rem] text-txt-tertiary">{c.contactRole||''}</div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {c.email&&<div><a href={`mailto:${c.email}`} className="text-[0.8rem] text-violet hover:underline">{c.email}</a></div>}
                                    {c.phone&&<div className="text-[0.8rem] text-txt-secondary tabular-nums">{c.phone}</div>}
                                    {!c.email&&!c.phone&&<span className="text-[0.8rem] text-txt-tertiary">—</span>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-green-50 cursor-pointer transition-all border border-transparent hover:border-green-100" title="Sendt e-post" onClick={e=>e.stopPropagation()}>
                                        <input type="checkbox" checked={t.emailed} onChange={e=>markEmailed(c.orgNumber,e.target.checked)} className="accent-green-500 w-3.5 h-3.5"/>
                                        <span className={`text-[0.72rem] font-medium ${t.emailed?'text-green-600':'text-txt-tertiary'}`}>Sendt</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-100" title="Ringt" onClick={e=>e.stopPropagation()}>
                                        <input type="checkbox" checked={t.called} onChange={e=>markCalled(c.orgNumber,e.target.checked)} className="accent-blue-500 w-3.5 h-3.5"/>
                                        <span className={`text-[0.72rem] font-medium ${t.called?'text-blue-600':'text-txt-tertiary'}`}>Ringt</span>
                                      </label>
                                      {isWon&&<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[0.68rem] font-semibold">Won</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      {c.email&&
                                        <a href={buildGmailUrl(c)} target="_blank" rel="noopener" onClick={()=>markEmailed(c.orgNumber)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet/10 text-violet rounded-lg text-[0.72rem] font-medium hover:bg-violet/20 transition-all" title="Send e-post"><Mail size={12}/> E-post</a>
                                      }
                                      {!isWon ? (
                                        <button onClick={async()=>{await addCustomer({orgNumber:c.orgNumber,name:c.name,contactName:c.contactName,contactRole:c.contactRole,email:c.email,phone:c.phone,industry:c.industry,municipality:c.municipality,revenue:c.revenue});toast.success(`${c.name} → Won!`)}} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.72rem] font-medium text-green-600 hover:bg-green-50 transition-all" title="Closed Won"><Trophy size={12}/> Won</button>
                                      ) : (
                                        <span className="px-2 py-1 text-[0.72rem] text-green-500 font-medium">✓ Kunde</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {filteredCompanies.length > (visibleCount[list.id]||20) && (
                        <button onClick={e=>{e.stopPropagation();setVisibleCount(p=>({...p,[list.id]:(p[list.id]||20)+30}))}} className="w-full py-3 text-center text-[0.85rem] text-violet font-medium hover:bg-violet-soft border-t border-surface-sunken transition-all">
                          Vis flere ({filteredCompanies.length-(visibleCount[list.id]||20)} gjenstår) ↓
                        </button>
                      )}
                    </div>
                  )})()}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Email Composer Modal */}
      {composerList && (() => {
        const list = lists.find(l => l.id === composerList)
        if (!list) return null
        const sel = getSelected(list.id)
        const targets = list.companies.filter(c => sel.has(c.orgNumber) && c.email)
        return (
          <EmailComposerModal
            companies={targets}
            onClose={() => setComposerList(null)}
            onSend={async (orgNums) => { await Promise.all(orgNums.map(o => markEmailed(o))); setComposerList(null) }}
          />
        )
      })()}
    </div>
  )
}
