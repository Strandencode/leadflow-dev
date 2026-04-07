import { useState, useEffect, useMemo } from 'react'
import { Plus, Sparkles, Trash2, Copy, Check, ChevronDown, Save } from 'lucide-react'
import { getActiveTemplate } from '../config/templates'
import toast from 'react-hot-toast'

const MERGE_TAGS = ['{{contact_name}}', '{{company_name}}', '{{industry}}', '{{city}}', '{{revenue}}', '{{sender_name}}', '{{sender_company}}']
const TEMPLATES_KEY = 'leadflow_saved_templates'

const DEFAULT_SEGMENTS = [
  { id: 'general', name: 'Generell', emoji: '📧', description: 'Standard e-postmal' },
]

// Generate email from template config, injecting ICP data into the text
function generateForSegment(segment, icp, template) {
  const company = icp.companyName || '{{sender_company}}'
  const product = icp.whatYouSell || 'våre produkter'
  const problem = icp.problemYouSolve || 'en løsning som kan hjelpe dere'
  const sender = icp.senderName || '{{sender_name}}'

  // Check if the active template has a specific email template for this segment
  if (template?.emailTemplates?.[segment]) {
    const tmpl = template.emailTemplates[segment]
    // Replace {{sender_company}} and {{sender_name}} with ICP values in the template
    let subj = tmpl.subject.replace(/\{\{sender_company\}\}/g, company).replace(/\{\{sender_name\}\}/g, sender)
    let body = tmpl.body.replace(/\{\{sender_company\}\}/g, company).replace(/\{\{sender_name\}\}/g, sender)
    return { subject: subj, body }
  }

  // Fallback: generic template using ICP data
  return {
    subject: `{{contact_name}} — ${company} kan hjelpe {{company_name}}`,
    body: `Hei {{contact_name}},

Jeg ser at {{company_name}} jobber innenfor {{industry}} i {{city}}, og tar kontakt fordi vi tror det kan være en god match.

${product}

${problem}

Hadde det passet med en kort samtale denne uken for å se om dette kan være aktuelt for {{company_name}}?

Vennlig hilsen,
${sender}
${company}`
  }
}

// Preview merge values
const PREVIEW_VALUES = {
  '{{contact_name}}': 'Erik Nilsen',
  '{{company_name}}': 'Cloudway Solutions',
  '{{industry}}': 'IT & Software',
  '{{city}}': 'Oslo',
  '{{revenue}}': '12.4M NOK',
  '{{sender_name}}': 'Jonas Dahl',
  '{{sender_company}}': 'LeadFlow',
}

export default function EmailPage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState([])
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [selectedSegment, setSelectedSegment] = useState('general')
  const [showSegmentPicker, setShowSegmentPicker] = useState(false)
  const [icp, setIcp] = useState({})

  // Get segments from active template
  const activeTemplate = useMemo(() => getActiveTemplate(), [])
  const SEGMENTS = useMemo(() => {
    const templateSegments = activeTemplate?.emailSegments
    return templateSegments?.length > 0 ? templateSegments : DEFAULT_SEGMENTS
  }, [activeTemplate])

  // Load saved templates and ICP on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY)
      if (stored) setSavedTemplates(JSON.parse(stored))
    } catch {}
    try {
      const icpData = localStorage.getItem('leadflow_icp')
      if (icpData) setIcp(JSON.parse(icpData))
    } catch {}
  }, [])

  function persistTemplates(updated) {
    setSavedTemplates(updated)
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated))
  }

  function handleSave() {
    if (!subject && !body) {
      toast.error('Skriv eller generer en mal først')
      return
    }
    const name = templateName.trim() || `Mal ${savedTemplates.length + 1}`
    const segment = SEGMENTS.find(s => s.id === selectedSegment)
    const template = {
      id: crypto.randomUUID(),
      name,
      subject,
      body,
      segmentId: selectedSegment,
      segmentName: segment?.name || 'Generell',
      segmentEmoji: segment?.emoji || '📧',
      createdAt: new Date().toISOString(),
    }
    persistTemplates([template, ...savedTemplates])
    setActiveTemplateId(template.id)
    setTemplateName(name)
    toast.success(`"${name}" lagret!`)
  }

  function loadTemplate(template) {
    setSubject(template.subject)
    setBody(template.body)
    setTemplateName(template.name)
    setActiveTemplateId(template.id)
    setSelectedSegment(template.segmentId || 'general')
    toast.success(`"${template.name}" lastet inn`)
  }

  function deleteTemplate(id, e) {
    e.stopPropagation()
    persistTemplates(savedTemplates.filter(t => t.id !== id))
    if (activeTemplateId === id) setActiveTemplateId(null)
    toast.success('Mal slettet')
  }

  function duplicateTemplate(template, e) {
    e.stopPropagation()
    const copy = { ...template, id: crypto.randomUUID(), name: template.name + ' (kopi)', createdAt: new Date().toISOString() }
    persistTemplates([copy, ...savedTemplates])
    toast.success('Mal duplisert')
  }

  async function handleGenerate() {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1200))

    const generated = generateForSegment(selectedSegment, icp, activeTemplate)
    setSubject(generated.subject)
    setBody(generated.body)

    const segment = SEGMENTS.find(s => s.id === selectedSegment)
    setTemplateName(`${segment?.emoji} ${segment?.name || 'Generell'} e-postmal`)
    setActiveTemplateId(null)
    setGenerating(false)
    toast.success(`Mal generert for ${segment?.name || 'generell'}!`)
  }

  function insertTag(tag) {
    setBody(prev => prev + tag)
  }

  function renderPreview(text) {
    let result = text
    for (const [tag, value] of Object.entries(PREVIEW_VALUES)) {
      result = result.replaceAll(tag, `<span class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">${value}</span>`)
    }
    return result
  }

  const icpFilled = icp.companyName || icp.whatYouSell

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-[1.6rem] font-normal tracking-tight text-ink">E-postmaler</h1>
          <p className="text-txt-tertiary text-[0.82rem] mt-0.5 font-light">
            {savedTemplates.length > 0
              ? `${savedTemplates.length} lagrede maler — velg segment og generer`
              : 'Lag eller generer e-postmaler med flettefelt'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSubject(''); setBody(''); setTemplateName(''); setActiveTemplateId(null) }} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium border border-gray-200 text-txt-secondary hover:bg-gray-50 transition-all">
            <Plus size={15} /> Ny tom mal
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-[260px_1fr_1fr] gap-5">

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Segment picker */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h3 className="text-[0.82rem] font-medium mb-3 flex items-center gap-1.5 text-ink">
                <Sparkles size={14} className="text-gold" /> Generer mal
              </h3>

              {!icpFilled && (
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-[0.75rem] text-blue-700 mb-3 font-light">
                  Tips: Fyll ut ICP-profilen for bedre maler
                </div>
              )}

              <label className="block text-[0.65rem] font-medium uppercase tracking-[0.1em] text-txt-tertiary mb-2">Kundesegment</label>
              <div className="relative mb-3">
                <button
                  onClick={() => setShowSegmentPicker(!showSegmentPicker)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded text-[0.82rem] text-left hover:border-gray-200 transition-all"
                >
                  <span>{SEGMENTS.find(s => s.id === selectedSegment)?.emoji} {SEGMENTS.find(s => s.id === selectedSegment)?.name}</span>
                  <ChevronDown size={14} className="text-txt-tertiary" />
                </button>
                {showSegmentPicker && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                    {SEGMENTS.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSegment(s.id); setShowSegmentPicker(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[0.82rem] hover:bg-gray-50 transition-colors ${selectedSegment === s.id ? 'bg-blue-50 text-gold font-medium' : 'text-txt-secondary'}`}
                      >
                        <span>{s.emoji}</span> {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold text-white rounded text-[0.82rem] font-medium hover:bg-gold-light transition-all disabled:opacity-60"
              >
                {generating
                  ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Genererer...</>
                  : <><Sparkles size={14} /> Generer for {SEGMENTS.find(s => s.id === selectedSegment)?.name}</>
                }
              </button>
            </div>

            {/* Saved templates list */}
            <div className="bg-white border border-gray-100 rounded-lg p-5">
              <h3 className="text-[0.82rem] font-medium mb-3 text-ink">Lagrede maler ({savedTemplates.length})</h3>

              {savedTemplates.length === 0 ? (
                <p className="text-[0.75rem] text-txt-tertiary font-light">Generer eller skriv en mal og klikk "Lagre" for å lagre den her.</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {savedTemplates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className={`group flex items-start gap-2 p-2.5 rounded cursor-pointer transition-all ${
                        activeTemplateId === t.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span className="text-sm mt-0.5">{t.segmentEmoji || '📧'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.82rem] font-medium truncate text-ink">{t.name}</div>
                        <div className="text-[0.68rem] text-txt-tertiary">{t.segmentName || 'Generell'} · {new Date(t.createdAt).toLocaleDateString('nb-NO')}</div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => duplicateTemplate(t, e)} className="p-1 rounded hover:bg-gray-100 text-txt-tertiary hover:text-ink" title="Dupliser"><Copy size={12} /></button>
                        <button onClick={e => deleteTemplate(t.id, e)} className="p-1 rounded hover:bg-red-50 text-txt-tertiary hover:text-red-500" title="Slett"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[0.88rem] font-medium text-ink">Redigering</h3>
                {activeTemplateId && <Check size={14} className="text-emerald-500" />}
              </div>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gold text-white rounded text-[0.78rem] font-medium hover:bg-gold-light transition-all">
                <Save size={13} /> Lagre mal
              </button>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Navn på malen..."
                className="w-full py-2 border-b border-gray-100 text-[0.82rem] outline-none bg-transparent mb-3 text-txt-secondary"
              />
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Emnelinje..."
                className="w-full py-2 border-b border-gray-100 text-[0.92rem] font-medium outline-none bg-transparent mb-4 text-ink"
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Skriv e-postinnhold her, eller klikk 'Generer' til venstre..."
                className="w-full min-h-[320px] p-4 bg-gray-50 border border-gray-100 rounded text-[0.88rem] outline-none resize-y leading-relaxed focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[0.68rem] text-txt-tertiary mr-1 self-center">Sett inn:</span>
                {MERGE_TAGS.map(tag => (
                  <button key={tag} onClick={() => insertTag(tag)} className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[0.68rem] font-medium hover:bg-gold hover:text-white transition-all">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-[0.88rem] font-medium text-ink">Forhåndsvisning</h3>
            </div>
            <div className="p-5">
              {!subject && !body ? (
                <div className="text-center py-12">
                  <Sparkles size={28} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-txt-tertiary text-[0.85rem] font-light">Velg et segment og generer en mal, eller skriv din egen</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 text-[0.82rem] text-txt-secondary flex flex-col gap-1">
                    <div><strong className="text-ink font-medium">Til:</strong> erik@cloudway.no</div>
                    <div><strong className="text-ink font-medium">Emne:</strong> <span dangerouslySetInnerHTML={{ __html: renderPreview(subject) }} /></div>
                  </div>
                  <div className="text-[0.88rem] leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderPreview(body) }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
