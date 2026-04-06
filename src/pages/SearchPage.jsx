import { useState, useMemo, useRef } from 'react'
import { Search, Download, Loader2, Bookmark, Sparkles, X, ChevronRight, ChevronDown, Mail, ExternalLink, Globe, Phone, Trophy, Zap } from 'lucide-react'
import { fetchAllBasic, enrichCompanies, NACE_CODES, MUNICIPALITIES, EMPLOYEE_RANGES, formatNOK } from '../api/brreg'
import { useSavedLists } from '../hooks/useSavedLists'
import { usePipeline } from '../hooks/usePipeline'
import { useCustomers } from '../hooks/useCustomers'
import TEMPLATES, { getActiveTemplate, applyTemplate } from '../config/templates'
import EmailComposerModal from '../components/EmailComposerModal'
import toast from 'react-hot-toast'

// Default fallback searches when no template is active
const DEFAULT_SEARCHES = [
  { id: 'it-software', emoji: '💻', name: 'IT & Programvare', description: 'Teknologiselskaper, SaaS og programvareutvikling',
    filters: { industrikode: '62', kommunenummer: '', employeeRange: '' }, color: 'from-blue-500 to-indigo-500',
    include: null, exclude: null },
  { id: 'radgivning', emoji: '📊', name: 'Rådgivning', description: 'Konsulentselskaper og managementrådgivning',
    filters: { industrikode: '70', kommunenummer: '', employeeRange: '' }, color: 'from-violet-500 to-purple-500',
    include: null, exclude: null },
  { id: 'regnskap-juss', emoji: '📋', name: 'Regnskap & Juss', description: 'Regnskapsførere, revisorer og advokatfirmaer',
    filters: { industrikode: '69', kommunenummer: '', employeeRange: '' }, color: 'from-emerald-500 to-teal-500',
    include: null, exclude: null },
  { id: 'bygg-anlegg', emoji: '🏗️', name: 'Bygg & Anlegg', description: 'Byggefirmaer og entreprenører',
    filters: { industrikode: '41', kommunenummer: '', employeeRange: '' }, color: 'from-amber-500 to-orange-500',
    include: null, exclude: null },
  { id: 'detaljhandel', emoji: '🛍️', name: 'Detaljhandel', description: 'Butikker og detaljhandelsvirksomheter',
    filters: { industrikode: '47', kommunenummer: '', employeeRange: '' }, color: 'from-pink-500 to-rose-500',
    include: null, exclude: null },
  { id: 'servering', emoji: '🍽️', name: 'Servering', description: 'Restauranter, kafeer og catering',
    filters: { industrikode: '56', kommunenummer: '', employeeRange: '' }, color: 'from-red-500 to-orange-500',
    include: null, exclude: null },
]

function buildGmailUrl(c) {
  const n = c.contactName && c.contactName !== '—' ? c.contactName : ''
  return `https://mail.google.com/mail/?view=cm&to=${c.email||''}&su=${encodeURIComponent('Hei '+n+' — en henvendelse angående '+c.name)}&body=${encodeURIComponent('Hei '+n+',\n\nJeg tar kontakt fordi jeg tror vi kan hjelpe '+c.name+'.\n\nVennlig hilsen')}`
}
function buildOutlookUrl(c) {
  const n = c.contactName && c.contactName !== '—' ? c.contactName : ''
  return `https://outlook.office.com/mail/deeplink/compose?to=${c.email||''}&subject=${encodeURIComponent('Hei '+n+' — en henvendelse angående '+c.name)}&body=${encodeURIComponent('Hei '+n+',\n\nJeg tar kontakt fordi jeg tror vi kan hjelpe '+c.name+'.\n\nVennlig hilsen')}`
}

const PAGE_SIZE = 50

export default function SearchPage() {
  const [filters, setFilters] = useState({ query:'', industrikode:'', kommunenummer:'', employeeRange:'', fraRegistreringsdato:'', tilRegistreringsdato:'', dateType:'registrering' })
  const [allCompanies, setAllCompanies] = useState([]) // after keyword filter
  const [rawCompanies, setRawCompanies] = useState([]) // before keyword filter
  const [globalStats, setGlobalStats] = useState(null)
  const [keywordRules, setKeywordRules] = useState({ include: null, exclude: null })
  const [keywordActive, setKeywordActive] = useState(true) // toggle on/off
  const [enrichedCache, setEnrichedCache] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [enriching, setEnriching] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [expandedRow, setExpandedRow] = useState(null)
  const [contactFilter, setContactFilter] = useState('all')
  const [tableSearch, setTableSearch] = useState('')
  const [sortBy, setSortBy] = useState('') // '' | 'name' | 'revenue' | 'employees' | 'founded'
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(0)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [searchName, setSearchName] = useState('')
  const [enrichAllProgress, setEnrichAllProgress] = useState(null) // { done, total } or null
  const enrichAllAbort = useRef(false)
  const [searchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('leadflow_search_history') || '[]') } catch { return [] }
  })
  const { saveList, markEmailed: _markEmailed, markCalled: _markCalled, getTracking, getListsForOrg } = useSavedLists()
  const { autoAdvanceToContacted } = usePipeline()
  const { addCustomer, isCustomer } = useCustomers()

  // Wrap markEmailed/markCalled to auto-advance pipeline
  function markEmailed(orgNumber, value = true) {
    _markEmailed(orgNumber, value)
    if (value) autoAdvanceToContacted(orgNumber)
  }
  function markCalled(orgNumber, value) {
    _markCalled(orgNumber, value)
    if (value) autoAdvanceToContacted(orgNumber)
  }

  // Get suggested searches from active template, or use defaults
  const [activeTemplateId, setActiveTemplateId] = useState(() => localStorage.getItem('leadflow_template') || 'general')
  const SUGGESTED_SEARCHES = useMemo(() => {
    const template = getActiveTemplate()
    return template.suggestedSearches?.length > 0 ? template.suggestedSearches : DEFAULT_SEARCHES
  }, [activeTemplateId])

  function handleSwitchTemplate(id) {
    applyTemplate(id)
    setActiveTemplateId(id)
  }

  // Filtered list based on contact filter + table search
  let filtered = contactFilter === 'email' ? allCompanies.filter(c=>c.email)
    : contactFilter === 'phone' ? allCompanies.filter(c=>c.phone)
    : contactFilter === 'any' ? allCompanies.filter(c=>c.email||c.phone)
    : allCompanies

  // Apply table search
  if (tableSearch.trim()) {
    const q = tableSearch.toLowerCase()
    filtered = filtered.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.municipality||'').toLowerCase().includes(q) ||
      (c.industry||'').toLowerCase().includes(q) ||
      (c.contactName||'').toLowerCase().includes(q) ||
      (c.email||'').toLowerCase().includes(q) ||
      (c.orgNumber||'').includes(q)
    )
  }

  // Apply sorting
  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      let va, vb
      if (sortBy === 'name') { va = (a.name||'').toLowerCase(); vb = (b.name||'').toLowerCase() }
      else if (sortBy === 'revenue') { va = a.revenue ?? -1; vb = b.revenue ?? -1 }
      else if (sortBy === 'employees') { va = a.employees ?? -1; vb = b.employees ?? -1 }
      else if (sortBy === 'founded') { va = a.foundedDate || ''; vb = b.foundedDate || '' }
      else return 0
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }

  function toggleSort(col) {
    if (sortBy === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }
    else { setSortBy(col); setSortDir('desc') }
    setCurrentPage(0)
  }

  function sortIcon(col) {
    if (sortBy !== col) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSlice = filtered.slice(currentPage * PAGE_SIZE, (currentPage+1) * PAGE_SIZE)

  // Merge enriched data into page slice
  const displayCompanies = pageSlice.map(c => enrichedCache[c.orgNumber] || c)

  // PHASE 1: Fetch all companies for aggregate counts
  async function handleSearch(_, overrideFilters, name, kwRules) {
    const f = overrideFilters || filters
    setLoading(true); setCurrentPage(0); setExpandedRow(null); setContactFilter('all')
    setAllCompanies([]); setRawCompanies([]); setGlobalStats(null); setEnrichedCache({}); setSelectedRows(new Set())
    const rules = kwRules || { include: null, exclude: null }
    setKeywordRules(rules); setKeywordActive(true)
    if (name) setSearchName(name)
    try {
      const empRange = EMPLOYEE_RANGES.find(r => r.value === f.employeeRange)
      setLoadMsg('Henter alle selskaper fra Brønnøysundregistrene...')
      const { allCompanies: fetched } = await fetchAllBasic({
        query: f.query, industrikode: f.industrikode, kommunenummer: f.kommunenummer,
        fraAntallAnsatte: empRange?.fromVal||'', tilAntallAnsatte: empRange?.toVal||'',
        fraRegistreringsdato: f.fraRegistreringsdato, tilRegistreringsdato: f.tilRegistreringsdato,
        dateType: f.dateType || 'registrering',
      })

      setRawCompanies(fetched)

      // Apply keyword filtering
      let companies = fetched
      const hasKeywords = rules.include || rules.exclude
      if (hasKeywords) {
        setLoadMsg('Filtrerer med nøkkelord...')
        companies = applyKeywordFilter(fetched, rules)
      }

      const stats = buildStats(companies)
      setAllCompanies(companies)
      setGlobalStats(stats)
      if (!companies.length) { toast('Ingen resultater. Prøv bredere filtre.', {icon:'🔍'}); setLoading(false); return }

      const filterMsg = hasKeywords && fetched.length !== companies.length
        ? ` (filtrert fra ${fetched.length} med nøkkelord)`
        : ''
      toast.success(`${stats.total} selskaper${filterMsg} — ${stats.withEmail} e-post, ${stats.withPhone} telefon`)

      // PHASE 2: Enrich first page
      setLoadMsg(`Henter kontaktinfo og regnskap for side 1...`)
      const first = companies.slice(0, PAGE_SIZE)
      const enriched = await enrichCompanies(first)
      const cache = {}; enriched.forEach(c => { cache[c.orgNumber] = c })
      setEnrichedCache(cache)

      // Save to search history
      const sName = name || searchName || 'Egendefinert søk'
      const nace = NACE_CODES.find(n => n.value === f.industrikode)
      const histEntry = { name: sName, filters: { ...f }, results: stats.total, date: new Date().toISOString(), naceLabel: nace?.label?.split(' — ')[1] || '' }
      try {
        const prev = JSON.parse(localStorage.getItem('leadflow_search_history') || '[]')
        const updated = [histEntry, ...prev.filter(h => h.name !== sName)].slice(0, 10)
        localStorage.setItem('leadflow_search_history', JSON.stringify(updated))
      } catch {}
    } catch(e) { toast.error('Søket feilet.'); console.error(e) }
    finally { setLoading(false); setLoadMsg('') }
  }

  function applyKeywordFilter(companies, rules) {
    if (!rules.include && !rules.exclude) return companies
    return companies.filter(c => {
      const text = `${c.name} ${c.industry} ${c.purpose}`
      if (rules.exclude && rules.exclude.test(text)) return false
      if (rules.include && !rules.include.test(text)) return false
      return true
    })
  }

  function buildStats(companies) {
    return {
      total: companies.length,
      withEmail: companies.filter(c => c.email).length,
      withPhone: companies.filter(c => c.phone).length,
      withAny: companies.filter(c => c.email || c.phone).length,
    }
  }

  function toggleKeywordFilter() {
    const newActive = !keywordActive
    setKeywordActive(newActive)
    setCurrentPage(0)
    if (newActive && (keywordRules.include || keywordRules.exclude)) {
      const filtered = applyKeywordFilter(rawCompanies, keywordRules)
      setAllCompanies(filtered)
      setGlobalStats(buildStats(filtered))
      toast.success(`Nøkkelordfilter PÅ — ${filtered.length} av ${rawCompanies.length} selskaper`)
    } else {
      setAllCompanies(rawCompanies)
      setGlobalStats(buildStats(rawCompanies))
      toast.success(`Nøkkelordfilter AV — viser alle ${rawCompanies.length} selskaper`)
    }
  }

  // Enrich when changing page
  async function goToPage(p) {
    setCurrentPage(p); setExpandedRow(null)
    const slice = filtered.slice(p*PAGE_SIZE, (p+1)*PAGE_SIZE)
    const needsEnrich = slice.filter(c => !enrichedCache[c.orgNumber])
    if (needsEnrich.length) {
      setEnriching(true)
      try {
        const enriched = await enrichCompanies(needsEnrich)
        setEnrichedCache(prev => { const n = {...prev}; enriched.forEach(c=>{n[c.orgNumber]=c}); return n })
      } catch(e) { console.error(e) }
      finally { setEnriching(false) }
    }
  }

  // Enrich ALL companies in background
  async function enrichAll() {
    const needsEnrich = filtered.filter(c => !enrichedCache[c.orgNumber])
    if (!needsEnrich.length) { toast.success('Alle leads er allerede enrichet!'); return }
    enrichAllAbort.current = false
    setEnrichAllProgress({ done: 0, total: needsEnrich.length })
    const BATCH = 10
    let done = 0
    try {
      for (let i = 0; i < needsEnrich.length; i += BATCH) {
        if (enrichAllAbort.current) { toast('Enrichment avbrutt', { icon: '⏹' }); break }
        const batch = needsEnrich.slice(i, i + BATCH)
        const enriched = await enrichCompanies(batch)
        setEnrichedCache(prev => { const n = { ...prev }; enriched.forEach(c => { n[c.orgNumber] = c }); return n })
        done += enriched.length
        setEnrichAllProgress({ done, total: needsEnrich.length })
      }
      if (!enrichAllAbort.current) toast.success(`Enrichet ${done} leads med kontaktinfo og regnskap!`)
    } catch (e) { console.error(e); toast.error('Enrichment feilet delvis') }
    finally { setEnrichAllProgress(null) }
  }

  function cancelEnrichAll() { enrichAllAbort.current = true }

  function handleSuggestedSearch(s) {
    const f = { query:'', industrikode:s.filters.industrikode||'', kommunenummer:s.filters.kommunenummer||'', employeeRange:s.filters.employeeRange||'', fraRegistreringsdato:'', tilRegistreringsdato:'' }
    setFilters(f); handleSearch(0, f, s.name, { include: s.include || null, exclude: s.exclude || null })
  }

  function handleSave() {
    const toSave = selectedRows.size > 0 ? filtered.filter(c => selectedRows.has(c.orgNumber)) : filtered
    if (!toSave.length) return
    const nm = saveName.trim() || searchName || 'Uten navn'
    const nace = NACE_CODES.find(n=>n.value===filters.industrikode)
    const muni = MUNICIPALITIES.find(m=>m.value===filters.kommunenummer)
    const emp = EMPLOYEE_RANGES.find(r=>r.value===filters.employeeRange)
    const parts = [nace?.label?.split(' — ')[1]||'', muni?.label||'', emp?.label||''].filter(Boolean)
    const companiesWithEnrichment = toSave.map(c => enrichedCache[c.orgNumber] ? { ...c, ...enrichedCache[c.orgNumber] } : c)
    saveList({ name:nm, filters:{...filters}, filterLabels:parts.join(' · ')||'Alle filtre', companies:companiesWithEnrichment, totalResults:toSave.length })
    toast.success(`"${nm}" lagret med ${toSave.length} leads!`)
    setShowSaveModal(false); setSaveName('')
  }

  function toggleRow(o) { setSelectedRows(p=>{const n=new Set(p);n.has(o)?n.delete(o):n.add(o);return n}) }
  function toggleAll() { if(!displayCompanies.length)return; selectedRows.size===displayCompanies.length?setSelectedRows(new Set()):setSelectedRows(new Set(displayCompanies.map(c=>c.orgNumber))) }

  function exportCSV() {
    if (!filtered.length) return
    const rows = (selectedRows.size > 0 ? filtered.filter(c=>selectedRows.has(c.orgNumber)) : filtered).map(c => enrichedCache[c.orgNumber] ? { ...c, ...enrichedCache[c.orgNumber] } : c)
    const h = ['Org Nr','Navn','Bransje','NACE','Adresse','Kommune','Ansatte','Stiftet','E-post','Telefon','Nettside','Kontakt','Omsetning','Driftsresultat']
    const csv = [h.join(';'), ...rows.map(c=>[c.orgNumber,c.name,c.industry,c.industryCode,c.address,c.municipality,c.employees??'',c.foundedDate,c.email||'',c.phone||'',c.website||'',c.contactName||'',c.revenue??'',c.operatingProfit??''].map(v=>`"${v}"`).join(';'))].join('\n')
    const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url
    a.download = `leadflow-${(searchName||'export').toLowerCase().replace(/\s+/g,'-')}-${contactFilter!=='all'?contactFilter+'-':''}${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url); toast.success(`Eksporterte ${rows.length} leads`)
  }

  function resetSearch() {
    setAllCompanies([]); setRawCompanies([]); setGlobalStats(null); setEnrichedCache({}); setSearchName('')
    setExpandedRow(null); setContactFilter('all'); setCurrentPage(0); setSelectedRows(new Set())
    setKeywordRules({ include: null, exclude: null })
    setFilters({ query:'', industrikode:'', kommunenummer:'', employeeRange:'', fraRegistreringsdato:'', tilRegistreringsdato:'', dateType:'registrering' })
  }

  // Bulk email: open composer modal
  function getSelectedWithEmail() {
    return displayCompanies.filter(c => selectedRows.has(c.orgNumber) && c.email)
  }

  const [showEmailComposer, setShowEmailComposer] = useState(false)

  function openBulkEmail() {
    const targets = getSelectedWithEmail()
    if (!targets.length) { toast.error('Ingen valgte selskaper har e-post'); return }
    setShowEmailComposer(true)
  }

  function handleEmailsSent(orgNumbers) {
    orgNumbers.forEach(o => markEmailed(o))
  }

  function selectAllOnPage() {
    const pageOrgs = displayCompanies.map(c => c.orgNumber)
    const allSelected = pageOrgs.every(o => selectedRows.has(o))
    if (allSelected) {
      setSelectedRows(prev => { const n = new Set(prev); pageOrgs.forEach(o => n.delete(o)); return n })
    } else {
      setSelectedRows(prev => { const n = new Set(prev); pageOrgs.forEach(o => n.add(o)); return n })
    }
  }

  function selectAllWithEmail() {
    const withEmail = filtered.filter(c => c.email).map(c => c.orgNumber)
    setSelectedRows(new Set(withEmail))
    toast.success(`${withEmail.length} selskaper med e-post valgt`)
  }

  function clearSelection() { setSelectedRows(new Set()) }

  function InfoRow({label,value,color}) {
    return <div className="flex justify-between py-1.5 border-b border-surface-sunken last:border-0"><span className="text-[0.78rem] text-txt-tertiary">{label}</span><span className={`text-[0.82rem] font-medium ${color||'text-txt-primary'}`}>{value||'—'}</span></div>
  }

  const hasResults = allCompanies.length > 0

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Finn Leads</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">{searchName ? <>Søkeresultater for <strong className="text-txt-primary">{searchName}</strong></> : 'Søk etter selskaper som matcher dine kriterier'}</p>
        </div>
        <div className="flex gap-2">
          {hasResults && (<>
            {enrichAllProgress ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.82rem] font-medium bg-violet/10 text-violet border border-violet/20">
                <Loader2 size={14} className="animate-spin"/>
                <span>Enricher {enrichAllProgress.done}/{enrichAllProgress.total}</span>
                <button onClick={cancelEnrichAll} className="ml-1 text-violet/60 hover:text-violet">✕</button>
              </div>
            ) : (
              <button onClick={enrichAll} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium border border-violet/30 text-violet hover:bg-violet/10 transition-all"><Zap size={16}/> Enrich alle</button>
            )}
            <button onClick={()=>{setSaveName(searchName);setShowSaveModal(true)}} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all"><Bookmark size={16}/> Lagre liste</button>
            <button onClick={exportCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all"><Download size={16}/> Eksporter CSV</button>
          </>)}
          <button onClick={()=>handleSearch(0)} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium text-white hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60" style={{background:'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)'}}>
            {loading?<Loader2 size={16} className="animate-spin"/>:<Search size={16}/>} {loading?'Søker...':'Søk'}
          </button>
        </div>
      </div>

      {/* Floating selection bar */}
      {selectedRows.size > 0 && (
        <div className="sticky top-[73px] z-[45] mx-8 mt-[-1px]">
          <div className="bg-ink text-white rounded-b-xl px-5 py-3 flex items-center justify-between shadow-lg animate-in">
            <div className="flex items-center gap-3">
              <span className="text-[0.88rem] font-medium">✓ {selectedRows.size} valgt</span>
              <span className="text-white/30">|</span>
              <span className="text-[0.82rem] text-white/60">{getSelectedWithEmail().length} med e-post</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAllOnPage} className="px-3 py-1.5 rounded-lg text-[0.8rem] font-medium bg-white/10 hover:bg-white/20 transition-all">
                {displayCompanies.every(c => selectedRows.has(c.orgNumber)) ? 'Fjern alle på side' : 'Velg alle på side'}
              </button>
              <button onClick={selectAllWithEmail} className="px-3 py-1.5 rounded-lg text-[0.8rem] font-medium bg-white/10 hover:bg-white/20 transition-all">
                Velg alle med e-post ({globalStats?.withEmail || 0})
              </button>
              <span className="text-white/20 mx-1">|</span>
              <button onClick={openBulkEmail} disabled={!getSelectedWithEmail().length} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[0.82rem] font-semibold bg-coral hover:bg-coral-hover disabled:opacity-40 transition-all">
                <Mail size={14}/> Send e-post ({getSelectedWithEmail().length})
              </button>
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.82rem] font-medium bg-white/10 hover:bg-white/20 transition-all">
                <Download size={13}/> CSV
              </button>
              <button onClick={clearSelection} className="px-2 py-1.5 rounded-lg text-[0.82rem] text-white/50 hover:text-white hover:bg-white/10 transition-all">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        {/* Template selector + Suggested Searches */}
        {!hasResults && !loading && (
          <div className="mb-8">
            {/* Template selector */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="text-[0.78rem] text-txt-tertiary font-medium">Bransjemal:</span>
              {TEMPLATES.filter(t => t.id !== 'general').map(t => (
                <button key={t.id} onClick={() => handleSwitchTemplate(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[0.82rem] font-medium border transition-all ${
                    activeTemplateId === t.id
                      ? 'border-gold bg-gold/[0.06] text-gold'
                      : 'border-bdr text-txt-secondary hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span>{t.icon}</span> {t.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-4"><Sparkles size={18} className="text-gold"/><h2 className="font-display text-lg font-semibold">Foreslåtte leadsøk</h2><span className="text-[0.78rem] text-txt-tertiary ml-1">basert på valgt mal</span></div>
            <div className="grid grid-cols-2 gap-3">
              {SUGGESTED_SEARCHES.map(s=>(
                <button key={s.id} onClick={()=>handleSuggestedSearch(s)} className="group flex items-start gap-4 p-4 bg-surface-raised border border-bdr rounded-xl text-left hover:border-violet/40 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>{s.emoji}</div>
                  <div className="flex-1 min-w-0"><div className="font-semibold text-[0.9rem] group-hover:text-violet transition-colors">{s.name}</div><div className="text-[0.8rem] text-txt-tertiary mt-0.5">{s.description}</div></div>
                  <ChevronRight size={16} className="text-txt-tertiary/40 group-hover:text-violet mt-1 flex-shrink-0 transition-colors"/>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
          {/* Filters */}
          <div className="bg-surface-raised border border-bdr rounded-xl p-6 sticky top-[88px]">
            <h3 className="font-display text-lg font-semibold mb-6">Filtre</h3>
            <div className="mb-5"><label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Selskapsnavn</label><input type="text" value={filters.query} onChange={e=>setFilters(f=>({...f,query:e.target.value}))} placeholder="Søk etter navn..." className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" onKeyDown={e=>e.key==='Enter'&&handleSearch(0)}/></div>
            <div className="mb-5"><label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Bransje / NACE-kode</label><select value={filters.industrikode} onChange={e=>setFilters(f=>({...f,industrikode:e.target.value}))} className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none appearance-none cursor-pointer">{NACE_CODES.map(n=><option key={n.value} value={n.value}>{n.label}</option>)}</select></div>
            <div className="mb-5"><label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Region</label><select value={filters.kommunenummer} onChange={e=>setFilters(f=>({...f,kommunenummer:e.target.value}))} className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none appearance-none cursor-pointer">{MUNICIPALITIES.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            <div className="mb-5"><label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Antall ansatte</label><div className="flex flex-wrap gap-2">{EMPLOYEE_RANGES.map(r=>(<button key={r.value} onClick={()=>setFilters(f=>({...f,employeeRange:f.employeeRange===r.value?'':r.value}))} className={`px-3.5 py-1.5 rounded-full text-[0.82rem] font-medium border transition-all ${filters.employeeRange===r.value?'bg-violet-soft border-violet text-violet':'border-bdr text-txt-secondary hover:border-violet hover:text-violet'}`}>{r.label}</button>))}</div></div>
            <hr className="border-bdr my-5"/>
            <div className="mb-5">
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Dato</label>
              <div className="flex gap-1 mb-2">
                <button onClick={()=>setFilters(f=>({...f,dateType:'registrering'}))} className={`flex-1 py-1.5 rounded-lg text-[0.78rem] font-medium transition-all ${filters.dateType==='registrering'?'bg-violet-soft text-violet border border-violet':'bg-surface border border-bdr text-txt-tertiary hover:text-txt-secondary'}`}>Registrert i Brreg</button>
                <button onClick={()=>setFilters(f=>({...f,dateType:'stiftelse'}))} className={`flex-1 py-1.5 rounded-lg text-[0.78rem] font-medium transition-all ${filters.dateType==='stiftelse'?'bg-violet-soft text-violet border border-violet':'bg-surface border border-bdr text-txt-tertiary hover:text-txt-secondary'}`}>Stiftet</button>
              </div>
              <div className="grid grid-cols-2 gap-2"><input type="date" value={filters.fraRegistreringsdato} onChange={e=>setFilters(f=>({...f,fraRegistreringsdato:e.target.value}))} className="w-full px-3 py-2.5 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none"/><input type="date" value={filters.tilRegistreringsdato} onChange={e=>setFilters(f=>({...f,tilRegistreringsdato:e.target.value}))} className="w-full px-3 py-2.5 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none"/></div>
            </div>
            <button onClick={()=>{setSearchName('');handleSearch(0)}} disabled={loading} className="w-full mt-2 py-3 bg-coral text-white rounded-lg font-semibold text-[0.9rem] hover:bg-coral-hover transition-all disabled:opacity-60">{loading?'Søker...':'Bruk filtre og søk'}</button>
            {hasResults && <button onClick={resetSearch} className="w-full mt-2 py-2.5 text-txt-secondary text-[0.85rem] font-medium hover:text-txt-primary transition-colors">← Tilbake til foreslåtte søk</button>}
          </div>

          {/* Results */}
          <div className="min-w-0">
            {/* Global stats bar */}
            {globalStats && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[0.9rem] text-txt-secondary">
                    Totalt <strong className="text-txt-primary font-semibold">{globalStats.total.toLocaleString('nb-NO')}</strong> selskaper funnet
                    {(keywordRules.include || keywordRules.exclude) && (
                      <button onClick={toggleKeywordFilter} className={`ml-2 px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold transition-all ${
                        keywordActive
                          ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                          : 'bg-surface-sunken text-txt-tertiary hover:bg-surface border border-bdr line-through'
                      }`}>
                        {keywordActive ? '✓' : '✗'} Nøkkelordfilter {keywordActive ? 'PÅ' : 'AV'}
                        {keywordActive && rawCompanies.length !== allCompanies.length && ` (${rawCompanies.length} → ${allCompanies.length})`}
                      </button>
                    )}
                    {contactFilter !== 'all' && <> — viser <strong className="text-txt-primary font-semibold">{filtered.length}</strong> filtrert</>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {[
                    { key:'all', label:'Alle', count:globalStats.total },
                    { key:'any', label:'✉📱 Har kontaktinfo', count:globalStats.withAny },
                    { key:'email', label:'✉ Har e-post', count:globalStats.withEmail },
                    { key:'phone', label:'📱 Har telefon', count:globalStats.withPhone },
                  ].map(f=>(
                    <button key={f.key} onClick={()=>{setContactFilter(f.key);setCurrentPage(0)}} className={`px-3.5 py-1.5 rounded-full text-[0.82rem] font-medium border transition-all ${contactFilter===f.key?'bg-violet-soft border-violet text-violet':'border-bdr text-txt-secondary hover:border-violet hover:text-violet'}`}>
                      {f.label} ({f.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty / Loading states */}
            {!hasResults && !loading && (
              <div className="bg-surface-raised border border-bdr rounded-xl p-16 text-center">
                <Search size={48} className="mx-auto text-txt-tertiary/40 mb-4"/>
                <h3 className="font-display text-lg font-semibold text-txt-secondary mb-2">Velg et foreslått søk</h3>
                <p className="text-txt-tertiary text-[0.9rem] max-w-md mx-auto mb-6">Klikk på et foreslått søk over, eller bruk filtrene til venstre.</p>
                {searchHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-bdr">
                    <h4 className="text-[0.78rem] text-txt-tertiary uppercase tracking-wide font-semibold mb-3">Siste søk</h4>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {searchHistory.slice(0, 5).map((h, i) => (
                        <button key={i} onClick={() => { setFilters(h.filters); handleSearch(0, h.filters, h.name) }}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-bdr text-[0.82rem] text-txt-secondary hover:border-violet hover:text-violet transition-all">
                          <span className="font-medium">{h.name}</span>
                          <span className="text-[0.72rem] text-txt-tertiary">{h.results} treff</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {loading && <div className="bg-surface-raised border border-bdr rounded-xl p-16 text-center"><Loader2 size={36} className="mx-auto text-coral animate-spin mb-4"/><p className="text-txt-secondary text-[0.9rem]">{loadMsg}</p></div>}

            {/* Results table */}
            {hasResults && !loading && displayCompanies.length > 0 && (
              <div className="bg-surface-raised border border-bdr rounded-xl overflow-hidden">
                {/* Table search bar */}
                <div className="px-4 py-3 border-b border-bdr flex items-center gap-3">
                  <Search size={16} className="text-txt-tertiary flex-shrink-0"/>
                  <input type="text" value={tableSearch} onChange={e=>{setTableSearch(e.target.value);setCurrentPage(0)}} placeholder="Søk i resultater — navn, kommune, bransje, e-post..." className="flex-1 bg-transparent text-[0.88rem] outline-none placeholder-txt-tertiary"/>
                  {tableSearch && <button onClick={()=>setTableSearch('')} className="text-txt-tertiary hover:text-txt-primary text-[0.82rem]">✕</button>}
                  {tableSearch && <span className="text-[0.78rem] text-txt-tertiary">{filtered.length} treff</span>}
                </div>
                {enriching && <div className="px-4 py-2 bg-violet-soft text-violet text-[0.82rem] font-medium flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Henter kontaktinfo og regnskap for denne siden...</div>}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-sunken">
                      <tr>
                        <th className="text-left px-4 py-3 w-9"><input type="checkbox" onChange={toggleAll} checked={selectedRows.size===displayCompanies.length&&displayCompanies.length>0} className="accent-coral w-4 h-4 cursor-pointer"/></th>
                        <th onClick={()=>toggleSort('name')} className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold cursor-pointer hover:text-txt-secondary transition-colors select-none">Selskap <span className="text-[0.65rem]">{sortIcon('name')}</span></th>
                        <th className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold">Kontakt</th>
                        <th className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold">E-post / Tlf</th>
                        <th onClick={()=>toggleSort('revenue')} className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold cursor-pointer hover:text-txt-secondary transition-colors select-none">Omsetning <span className="text-[0.65rem]">{sortIcon('revenue')}</span></th>
                        <th onClick={()=>toggleSort('founded')} className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold cursor-pointer hover:text-txt-secondary transition-colors select-none">Stiftet / Reg. <span className="text-[0.65rem]">{sortIcon('founded')}</span></th>
                        <th onClick={()=>toggleSort('employees')} className="text-left px-4 py-3 text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold cursor-pointer hover:text-txt-secondary transition-colors select-none">Ansatte <span className="text-[0.65rem]">{sortIcon('employees')}</span></th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCompanies.map(c=>(<>
                        <tr key={c.orgNumber} className={`border-b border-surface-sunken hover:bg-surface/50 transition-colors cursor-pointer ${expandedRow===c.orgNumber?'bg-surface/50':''}`} onClick={()=>setExpandedRow(expandedRow===c.orgNumber?null:c.orgNumber)}>
                          <td className="px-4 py-3" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(c.orgNumber)} onChange={()=>toggleRow(c.orgNumber)} className="accent-coral w-4 h-4 cursor-pointer"/></td>
                          <td className="px-4 py-3"><div className="font-medium text-[0.88rem]">{c.name}{(()=>{const ll=getListsForOrg(c.orgNumber);return ll.length>0?<span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[0.62rem] font-medium" title={`Finnes i: ${ll.join(', ')}`}>📋 {ll.length} liste{ll.length>1?'r':''}</span>:null})()}</div><div className="text-[0.75rem] text-txt-tertiary">{c.industry}</div></td>
                          <td className="px-4 py-3"><div className="text-[0.85rem] font-medium">{c.contactName||'—'}</div><div className="text-[0.75rem] text-txt-tertiary">{c.contactRole||''}</div></td>
                          <td className="px-4 py-3">
                            {c.email&&<div><a href={`mailto:${c.email}`} onClick={e=>e.stopPropagation()} className="text-[0.8rem] text-violet hover:underline">{c.email}</a></div>}
                            {c.phone&&<div className="text-[0.8rem] text-txt-secondary tabular-nums">{c.phone}</div>}
                            {!c.email&&!c.phone&&<span className="text-[0.8rem] text-txt-tertiary">—</span>}
                          </td>
                          <td className="px-4 py-3"><div className="text-[0.85rem] font-medium tabular-nums">{c.revenue!=null?formatNOK(c.revenue):'—'}</div>{c.revenueYear&&<div className="text-[0.72rem] text-txt-tertiary">({c.revenueYear})</div>}</td>
                          <td className="px-4 py-3 text-[0.85rem] tabular-nums"><div className="text-txt-secondary">{c.foundedDate||'—'}</div>{c.registrationDate && c.registrationDate !== c.foundedDate && <div className="text-[0.72rem] text-txt-tertiary">Reg: {c.registrationDate}</div>}</td>
                          <td className="px-4 py-3 text-[0.85rem] font-medium tabular-nums">{c.employees??'—'}</td>
                          <td className="px-4 py-3">{expandedRow===c.orgNumber?<ChevronDown size={14} className="text-txt-tertiary"/>:<ChevronRight size={14} className="text-txt-tertiary"/>}</td>
                        </tr>

                        {expandedRow===c.orgNumber&&(
                          <tr key={c.orgNumber+'-d'} className="bg-surface/80">
                            <td colSpan={8} className="px-4 py-5">
                              <div className="grid grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold mb-3">Selskapsinformasjon</h4>
                                  <InfoRow label="Org.nr" value={c.orgNumber}/>
                                  <InfoRow label="Organisasjonsform" value={c.organizationForm}/>
                                  <InfoRow label="Stiftet" value={c.foundedDate}/>
                                  <InfoRow label="Registrert i Brreg" value={c.registrationDate}/>
                                  <InfoRow label="Adresse" value={c.address}/>
                                  <InfoRow label="Kommune" value={c.municipality}/>
                                  <InfoRow label="Ansatte" value={c.employees??'—'}/>
                                  <InfoRow label="Aksjekapital" value={c.shareCapital?`${c.shareCapital.toLocaleString('nb-NO')} kr`:'—'}/>
                                  {c.website&&<InfoRow label="Nettside" value={<a href={c.website.startsWith('http')?c.website:`https://${c.website}`} target="_blank" rel="noopener" className="text-violet hover:underline flex items-center gap-1" onClick={e=>e.stopPropagation()}><Globe size={12}/>{c.website}</a>}/>}
                                  {c.purpose&&<div className="mt-2 text-[0.78rem] text-txt-tertiary italic leading-relaxed line-clamp-3">{c.purpose}</div>}
                                </div>
                                <div>
                                  <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold mb-3">Regnskap {c.revenueYear&&`(${c.revenueYear})`}</h4>
                                  <InfoRow label="Omsetning" value={formatNOK(c.revenue)} color={c.revenue>0?'text-txt-primary':''}/>
                                  <InfoRow label="Driftsresultat" value={formatNOK(c.operatingProfit)} color={c.operatingProfit>0?'text-green-600':c.operatingProfit<0?'text-red-500':''}/>
                                  <InfoRow label="Årsresultat" value={formatNOK(c.netProfit)} color={c.netProfit>0?'text-green-600':c.netProfit<0?'text-red-500':''}/>
                                  <InfoRow label="Egenkapital" value={formatNOK(c.equity)}/>
                                  <InfoRow label="Sum eiendeler" value={formatNOK(c.totalAssets)}/>
                                  <InfoRow label="Regnskapsfører" value={c.accountant||'—'}/>
                                  <InfoRow label="Revisor" value={c.auditor||(c.noAudit?'Fravalgt':'—')}/>
                                </div>
                                <div>
                                  <h4 className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold mb-3">Kontakt & handling</h4>
                                  <InfoRow label="Kontaktperson" value={c.contactName}/>
                                  <InfoRow label="Stilling" value={c.contactRole}/>
                                  <InfoRow label="E-post" value={c.email?<a href={`mailto:${c.email}`} className="text-violet hover:underline">{c.email}</a>:'—'}/>
                                  <InfoRow label="Telefon" value={c.phone?<a href={`tel:${c.phone}`} className="text-txt-primary hover:text-violet">{c.phone}</a>:'—'}/>

                                  {(()=>{const t=getTracking(c.orgNumber);return(
                                    <div className="mt-3 pt-3 border-t border-surface-sunken">
                                      <div className="flex items-center gap-3 mb-3">
                                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-50 cursor-pointer transition-all border border-transparent hover:border-green-100" onClick={e=>e.stopPropagation()}>
                                          <input type="checkbox" checked={t.emailed} onChange={e=>markEmailed(c.orgNumber,e.target.checked)} className="accent-green-500 w-4 h-4 rounded"/>
                                          <span className={`text-[0.82rem] font-medium ${t.emailed?'text-green-600':'text-txt-secondary'}`}>Sendt e-post</span>
                                          {t.emailed&&t.emailedAt&&<span className="text-[0.7rem] text-green-500">{new Date(t.emailedAt).toLocaleDateString('nb-NO')}</span>}
                                        </label>
                                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-100" onClick={e=>e.stopPropagation()}>
                                          <input type="checkbox" checked={t.called} onChange={e=>markCalled(c.orgNumber,e.target.checked)} className="accent-blue-500 w-4 h-4 rounded"/>
                                          <span className={`text-[0.82rem] font-medium ${t.called?'text-blue-600':'text-txt-secondary'}`}>Ringt</span>
                                          {t.called&&t.calledAt&&<span className="text-[0.7rem] text-blue-500">{new Date(t.calledAt).toLocaleDateString('nb-NO')}</span>}
                                        </label>
                                      </div>
                                    </div>
                                  )})()}

                                  <div className="mt-4 flex flex-col gap-2">
                                    {c.email&&(
                                      <a href={buildGmailUrl(c)} target="_blank" rel="noopener" onClick={e=>{e.stopPropagation();markEmailed(c.orgNumber,true);toast.success('Markert som sendt')}} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-violet text-white rounded-lg text-[0.82rem] font-semibold hover:bg-violet/90 transition-all"><Mail size={14}/> Send e-post</a>
                                    )}
                                    {!c.email&&<div className="text-[0.82rem] text-txt-tertiary italic p-3 bg-surface-sunken rounded-lg text-center">Ingen e-post registrert</div>}
                                    <div className="flex gap-2 mt-2">
                                      {c.contactName&&c.contactName!=='—'&&<a href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.contactName)}`} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-bdr rounded-lg text-[0.75rem] font-medium text-txt-secondary hover:border-violet hover:text-violet transition-all"><ExternalLink size={11}/> LinkedIn</a>}
                                      <a href={`https://www.proff.no/bransjes%C3%B8k?q=${c.orgNumber}`} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-bdr rounded-lg text-[0.75rem] font-medium text-txt-secondary hover:border-violet hover:text-violet transition-all"><ExternalLink size={11}/> Proff.no</a>
                                      {c.contactName&&c.contactName!=='—'&&<a href={`https://www.1881.no/?query=${encodeURIComponent(c.contactName)}`} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-bdr rounded-lg text-[0.75rem] font-medium text-txt-secondary hover:border-violet hover:text-violet transition-all"><Phone size={11}/> 1881</a>}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-surface-sunken">
                                      {isCustomer(c.orgNumber)
                                        ? <div className="flex items-center gap-2 text-[0.82rem] text-green-600 font-medium"><Trophy size={14}/> Registrert som kunde</div>
                                        : <button onClick={e=>{e.stopPropagation();addCustomer({orgNumber:c.orgNumber,name:c.name,contactName:c.contactName,contactRole:c.contactRole,email:c.email,phone:c.phone,industry:c.industry,municipality:c.municipality,revenue:c.revenue});toast.success(`${c.name} lagt til som kunde!`)}} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg text-[0.82rem] font-semibold hover:bg-green-600 transition-all"><Trophy size={14}/> Marker som kunde (Closed Won)</button>
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-bdr text-[0.85rem] text-txt-secondary">
                    <span>Side {currentPage+1} av {totalPages} ({filtered.length} selskaper)</span>
                    <div className="flex gap-1">
                      <button onClick={()=>goToPage(currentPage-1)} disabled={currentPage===0||enriching} className="px-3 py-1.5 rounded-lg border border-bdr text-[0.85rem] font-medium hover:border-violet hover:text-violet disabled:opacity-30 transition-all">← Forrige</button>
                      <button onClick={()=>goToPage(currentPage+1)} disabled={currentPage>=totalPages-1||enriching} className="px-3 py-1.5 rounded-lg border border-bdr text-[0.85rem] font-medium hover:border-violet hover:text-violet disabled:opacity-30 transition-all">Neste →</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={()=>setShowSaveModal(false)}>
          <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md p-8" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl font-semibold">Lagre leadliste</h3>
              <button onClick={()=>setShowSaveModal(false)} className="p-1 rounded-lg hover:bg-surface-sunken"><X size={20} className="text-txt-tertiary"/></button>
            </div>
            <div className="mb-4">
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Navn på listen</label>
              <input type="text" value={saveName} onChange={e=>setSaveName(e.target.value)} placeholder="f.eks. Dyrebutikker hele Norge" autoFocus className="w-full px-3.5 py-3 bg-surface border border-bdr rounded-lg text-[0.95rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" onKeyDown={e=>e.key==='Enter'&&handleSave()}/>
            </div>
            {/* Selection info */}
            <div className="p-4 bg-surface-sunken rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.85rem] text-txt-secondary">
                  {selectedRows.size > 0
                    ? <><strong className="text-txt-primary">{selectedRows.size}</strong> av {filtered.length} valgt</>
                    : <><strong className="text-txt-primary">{filtered.length}</strong> leads vil bli lagret</>
                  }
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setSelectedRows(new Set(filtered.map(c=>c.orgNumber)))} className={`px-3 py-1.5 rounded-lg text-[0.78rem] font-medium transition-all ${selectedRows.size===filtered.length?'bg-violet text-white':'border border-bdr text-txt-secondary hover:border-violet hover:text-violet'}`}>
                  Velg alle ({filtered.length})
                </button>
                <button onClick={()=>setSelectedRows(new Set(filtered.filter(c=>c.email).map(c=>c.orgNumber)))} className={`px-3 py-1.5 rounded-lg text-[0.78rem] font-medium border border-bdr text-txt-secondary hover:border-violet hover:text-violet transition-all`}>
                  Kun med e-post ({filtered.filter(c=>c.email).length})
                </button>
                {selectedRows.size > 0 && (
                  <button onClick={()=>setSelectedRows(new Set())} className="px-3 py-1.5 rounded-lg text-[0.78rem] font-medium text-txt-tertiary hover:text-txt-secondary transition-all">
                    Fjern valg
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={()=>setShowSaveModal(false)} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">Avbryt</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium bg-coral text-white hover:bg-coral-hover transition-all">
                Lagre {selectedRows.size > 0 ? selectedRows.size : filtered.length} leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposerModal
          companies={getSelectedWithEmail()}
          onClose={() => setShowEmailComposer(false)}
          onSend={handleEmailsSent}
        />
      )}
    </div>
  )
}
