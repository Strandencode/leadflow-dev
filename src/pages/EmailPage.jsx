import { useState, useEffect } from 'react'
import { Plus, Sparkles, Trash2, Copy, Check, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const MERGE_TAGS = ['{{contact_name}}', '{{company_name}}', '{{industry}}', '{{city}}', '{{revenue}}', '{{sender_name}}', '{{sender_company}}']
const TEMPLATES_KEY = 'leadflow_saved_templates'

// Segment definitions matching the suggested searches
const SEGMENTS = [
  { id: 'general', name: 'Generell', emoji: '📧', description: 'Standard outreach-mal' },
  { id: 'dyrebutikker', name: 'Dyrebutikker', emoji: '🐕', description: 'Butikker med kjæledyrutstyr' },
  { id: 'veterinarer', name: 'Veterinærklinikker', emoji: '🏥', description: 'Dyreklinikker' },
  { id: 'helsekost', name: 'Helsekost & naturkost', emoji: '🌿', description: 'Naturkostbutikker' },
  { id: 'apotek', name: 'Apotek', emoji: '💊', description: 'Uavhengige apotek' },
  { id: 'hotell-spa', name: 'Hotell & spa', emoji: '🏨', description: 'Hoteller med wellness' },
  { id: 'frisor', name: 'Frisørsalonger', emoji: '💇', description: '3 200+ salonger' },
  { id: 'hudpleie', name: 'Skjønnhets- og hudpleie', emoji: '✨', description: 'Hudpleie, fotpleie, negler' },
  { id: 'fotpleie', name: 'Fotpleie & fotterapi', emoji: '🦶', description: 'Fotterapauter' },
  { id: 'spa', name: 'Spa & dagspa', emoji: '🧖', description: 'Spa og velvære' },
  { id: 'sykehjem', name: 'Sykehjem & omsorg', emoji: '🏠', description: 'Pleieinstitusjoner' },
  { id: 'dagligvare', name: 'Dagligvarebutikker', emoji: '🛒', description: 'Dagligvare' },
  { id: 'sport-ride', name: 'Sport & rideutstyr', emoji: '🐴', description: 'Ridebutikker' },
]

// Generate segment-specific email using ICP data
function generateForSegment(segment, icp) {
  const company = icp.companyName || '{{sender_company}}'
  const product = icp.whatYouSell || 'våre produkter'
  const problem = icp.problemYouSolve || 'en løsning som kan hjelpe dere'

  const templates = {
    general: {
      subject: `{{contact_name}} — ${company} kan hjelpe {{company_name}}`,
      body: `Hei {{contact_name}},

Jeg ser at {{company_name}} jobber innenfor {{industry}} i {{city}}, og tar kontakt fordi vi tror det kan være en god match.

${product}

${problem}

Hadde det passet med en kort samtale denne uken for å se om dette kan være aktuelt for {{company_name}}?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    dyrebutikker: {
      subject: `{{contact_name}} — naturlig dyrepleie for kundene til {{company_name}}`,
      body: `Hei {{contact_name}},

Jeg ser at {{company_name}} selger kjæledyrprodukter i {{city}}, og tar kontakt fordi vi har noe kundene deres etterspør.

${company} har utviklet en naturlig hudpleieserie for dyr basert på pH4-teknologi — uten parabener og kjemikalier. ${product.includes('[') ? 'Produktene hjelper mot kløe, tørr hud og eksem hos hund, hest og andre dyr.' : product}

Mange dyrebutikker opplever høy kundelojalitet med våre produkter fordi de faktisk virker — og kundene kommer tilbake for påfyll.

Kan jeg sende dere noen prøver slik at dere kan teste selv? Det tar 5 minutter å sette opp som forhandler.

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    veterinarer: {
      subject: `{{contact_name}} — dokumentert hudpleie dere kan anbefale til dyreeiere`,
      body: `Hei {{contact_name}},

Som veterinærklinikk i {{city}} møter dere sannsynligvis mange dyreeiere som sliter med kløe og hudproblemer hos kjæledyrene sine.

${company} har utviklet en pH4-basert hudpleieserie med organiske syrer og alginat som bevarer dyrets naturlige bakterieflora — i stedet for å ødelegge den med tradisjonelle sjampoer.

${problem.includes('[') ? 'Produktene er dokumentert effektive og alle ingredienser utenom vaskestoff er godkjent til bruk i mat.' : problem}

Mange veterinærer anbefaler oss allerede til sine kunder. Kan jeg sende informasjon og noen prøver til klinikken?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    helsekost: {
      subject: `{{contact_name}} — norskprodusert naturlig hudpleie for {{company_name}}`,
      body: `Hei {{contact_name}},

Jeg ser at {{company_name}} selger naturlige og økologiske produkter i {{city}}. Da tror jeg vi passer rett inn i sortimentet deres.

${company} lager naturlig hudpleie basert på pH4-teknologi — uten parabener, parfyme og miljøgifter. ${product.includes('[') ? 'Alle ingredienser utenom vaskestoff er godkjent til bruk i mat.' : product}

Produktene våre selger spesielt godt i helsekostbutikker fordi kundene allerede er bevisste på hva de putter på huden.

Vi er allerede hos flere naturkostkjeder. Kan vi ta en prat om å få ${company} inn hos dere?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    apotek: {
      subject: `{{contact_name}} — naturlig hudpleie kundene etterspør`,
      body: `Hei {{contact_name}},

Folk med hudproblemer handler ofte hos dere i {{city}}, og vi har et naturlig alternativ de spør etter.

${company} tilbyr dokumentert pH4-hudpleie som hjelper mot tørr hud, eksem og kløe — uten kortison og kjemikalier. ${product.includes('[') ? 'Produktene er parfymefrie og egner seg for hele familien, inkludert barn og eldre.' : product}

Kan jeg sende informasjon om forhandlervilkår og sortiment?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    'hotell-spa': {
      subject: `{{contact_name}} — norskprodusert hudpleie for gjestene på {{company_name}}`,
      body: `Hei {{contact_name}},

Gjester på {{company_name}} i {{city}} forventer kvalitetsprodukter — spesielt på spa og wellness.

${company} lager norskprodusert, naturlig hudpleie som gir gjestene en eksklusiv opplevelse med ren samvittighet. ${product.includes('[') ? 'Produktene er parfymefrie, parabenfrie og basert på norsk tang og tare.' : product}

Vi leverer allerede til hoteller som ønsker å skille seg ut med bærekraftige, lokale merkevarer. Skal vi ta en prat?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    frisor: {
      subject: `{{contact_name}} — hudpleie kundene dine vil elske`,
      body: `Hei {{contact_name}},

Som frisør i {{city}} har du daglig kontakt med kunder som bryr seg om hår og hud. Mange spør etter naturlige produkter.

${company} tilbyr en komplett hudpleieserie som kan selges over disk i salongen. ${product.includes('[') ? 'Mild, parfymefri og laget for sensitiv hud.' : product}

Det er enkel oppstart — og du tjener godt per produkt. Kan jeg sende deg noen prøver?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    hudpleie: {
      subject: `{{contact_name}} — naturlig pH4-hudpleie for klinikken din`,
      body: `Hei {{contact_name}},

Som hudterapeut i {{city}} vet du at riktig hudpleie starter med riktig pH-balanse.

${company} har utviklet en unik pH4-serie med organiske syrer og alginat som styrker hudens naturlige barriere. ${problem.includes('[') ? 'Produktene bevarer den gode bakteriefloraen i stedet for å ødelegge den.' : problem}

Flere hudpleieklinikker bruker og selger produktene våre allerede. Vil du teste dem på klinikken?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    sykehjem: {
      subject: `Mild hudpleie for beboerne på {{company_name}}`,
      body: `Hei {{contact_name}},

Beboere på {{company_name}} i {{city}} fortjener skånsom hudpleie — spesielt de med tørr og sensitiv hud.

${company} leverer parfymefri, pH4-balansert hudvask og balsam som er laget for daglig bruk uten å tørke ut huden. ${product.includes('[') ? 'Alle ingredienser utenom vaskestoff er godkjent til bruk i mat.' : product}

Vi leverer i store forpakninger til institusjoner med gode volumpriser. Kan jeg sende et tilbud?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    dagligvare: {
      subject: `{{contact_name}} — norsk hudpleie for hyllene i {{company_name}}`,
      body: `Hei {{contact_name}},

Flere og flere kunder i {{city}} spør etter norskproduserte, naturlige alternativer i hudpleie-hylla.

${company} tilbyr en komplett serie — fra hudvask til balsam — som er 100% norskprodusert, parfymefri og uten parabener. ${product.includes('[') ? 'Kundene som prøver kommer tilbake.' : product}

Vi er allerede hos Felleskjøpet og flere naturkostkjeder. Kan vi snakke om å få produktene inn hos {{company_name}}?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    'sport-ride': {
      subject: `{{contact_name}} — hestepleie og hudpleie for kundene til {{company_name}}`,
      body: `Hei {{contact_name}},

Ryttere og hesteeiere i {{city}} trenger kvalitetspleie for hestene sine — spesielt ved kløe og hudirritasjon.

${company} har en egen dyrepleieserie basert på pH4-teknologi som er spesialtilpasset hest. ${product.includes('[') ? 'Produktene fjerner ikke fett fra hud og pels, og kan brukes så ofte som nødvendig.' : product}

Vi leverer også hudpleie for ryttere — perfekt som tilleggsprodukt. Kan jeg sende prøver?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    fotpleie: {
      subject: `{{contact_name}} — pH4-hudpleie utviklet for fotterapeuter`,
      body: `Hei {{contact_name}},

Som fotterapeut i {{city}} vet du bedre enn de fleste hvor viktig riktig hudpleie er for føttene.

${company} har utviklet en pH4-balansert serie med organiske syrer og alginat som er ideell for fotpleie. ${product.includes('[') ? 'Produktene styrker hudens naturlige barriere og bevarer den gode bakteriefloraen.' : product}

Mange fotterapeuter bruker våre produkter både i behandling og selger dem videre til kunder for hjemmebruk — det gir en fin tilleggsinntekt.

Kan jeg sende deg noen prøver å teste på klinikken?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
    spa: {
      subject: `{{contact_name}} — norskprodusert hudpleie for {{company_name}}`,
      body: `Hei {{contact_name}},

Gjester hos {{company_name}} i {{city}} forventer produkter som er både effektive og naturlige.

${company} tilbyr norskprodusert pH4-hudpleie laget av tang og tare — uten parabener, parfyme eller miljøgifter. ${product.includes('[') ? 'Perfekt for spa-behandlinger og som produkter gjestene kan ta med hjem.' : product}

Vi leverer alt fra hudvask og balsam til spesialbehandling for tørr og sensitiv hud. Kan vi ta en prat om å få produktene inn hos dere?

Vennlig hilsen,
{{sender_name}}
${company}`
    },
  }

  return templates[segment] || templates.general
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
    // Simulate AI delay — in production this would call Claude API
    await new Promise(r => setTimeout(r, 1500))

    const generated = generateForSegment(selectedSegment, icp)
    setSubject(generated.subject)
    setBody(generated.body)

    const segment = SEGMENTS.find(s => s.id === selectedSegment)
    setTemplateName(`${segment?.emoji} ${segment?.name || 'Generell'} outreach`)
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
      result = result.replaceAll(tag, `<span class="bg-[rgba(255,107,74,0.15)] text-[#FF6B4A] px-1.5 py-0.5 rounded font-medium">${value}</span>`)
    }
    return result
  }

  const icpFilled = icp.companyName || icp.whatYouSell

  return (
    <div>
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">E-postmaler</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">
            {savedTemplates.length > 0
              ? `${savedTemplates.length} lagrede maler — velg segment og generer med AI`
              : 'Lag eller generer e-postmaler med flettefelt'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSubject(''); setBody(''); setTemplateName(''); setActiveTemplateId(null) }} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
            <Plus size={16} /> Ny tom mal
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-[280px_1fr_1fr] gap-6">

          {/* Saved templates sidebar */}
          <div className="space-y-4">
            {/* Segment picker for AI generation */}
            <div className="bg-surface-raised border border-bdr rounded-xl p-5">
              <h3 className="text-[0.82rem] font-semibold mb-3 flex items-center gap-1.5"><Sparkles size={14} className="text-violet" /> AI-generering</h3>

              {!icpFilled && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[0.78rem] text-amber-700 mb-3">
                  Tips: Fyll ut ICP-profilen din først for bedre maler
                </div>
              )}

              <label className="block text-[0.72rem] font-semibold uppercase tracking-wide text-txt-tertiary mb-2">Velg kundesegment</label>
              <div className="relative mb-3">
                <button
                  onClick={() => setShowSegmentPicker(!showSegmentPicker)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-surface border border-bdr rounded-lg text-[0.85rem] text-left hover:border-violet transition-all"
                >
                  <span>{SEGMENTS.find(s => s.id === selectedSegment)?.emoji} {SEGMENTS.find(s => s.id === selectedSegment)?.name}</span>
                  <ChevronDown size={14} className="text-txt-tertiary" />
                </button>
                {showSegmentPicker && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-surface-raised border border-bdr rounded-xl shadow-lg max-h-[300px] overflow-y-auto">
                    {SEGMENTS.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSegment(s.id); setShowSegmentPicker(false) }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[0.82rem] hover:bg-surface transition-colors ${selectedSegment === s.id ? 'bg-violet-soft text-violet font-medium' : 'text-txt-secondary'}`}
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
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet text-white rounded-lg text-[0.82rem] font-semibold hover:bg-[#6A4AE8] transition-all disabled:opacity-60"
              >
                {generating
                  ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Genererer...</>
                  : <><Sparkles size={14} /> Generer for {SEGMENTS.find(s => s.id === selectedSegment)?.name}</>
                }
              </button>
            </div>

            {/* Saved templates list */}
            <div className="bg-surface-raised border border-bdr rounded-xl p-5">
              <h3 className="text-[0.82rem] font-semibold mb-3">Lagrede maler ({savedTemplates.length})</h3>

              {savedTemplates.length === 0 ? (
                <p className="text-[0.78rem] text-txt-tertiary">Generer eller skriv en mal og klikk "Lagre" for å lagre den her.</p>
              ) : (
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                  {savedTemplates.map(t => (
                    <div
                      key={t.id}
                      onClick={() => loadTemplate(t)}
                      className={`group flex items-start gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                        activeTemplateId === t.id ? 'bg-violet-soft border border-violet/30' : 'hover:bg-surface border border-transparent'
                      }`}
                    >
                      <span className="text-sm mt-0.5">{t.segmentEmoji || '📧'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[0.82rem] font-medium truncate">{t.name}</div>
                        <div className="text-[0.7rem] text-txt-tertiary">{t.segmentName || 'Generell'} · {new Date(t.createdAt).toLocaleDateString('nb-NO')}</div>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => duplicateTemplate(t, e)} className="p-1 rounded hover:bg-surface-sunken text-txt-tertiary hover:text-txt-primary" title="Dupliser"><Copy size={12} /></button>
                        <button onClick={e => deleteTemplate(t.id, e)} className="p-1 rounded hover:bg-red-50 text-txt-tertiary hover:text-red-500" title="Slett"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="bg-surface-raised border border-bdr rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-bdr flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-[0.95rem] font-semibold">Redigering</h3>
                {activeTemplateId && <Check size={14} className="text-green-500" />}
              </div>
              <button onClick={handleSave} className="px-3 py-1.5 bg-coral text-white rounded-lg text-[0.8rem] font-medium hover:bg-coral-hover transition-all">
                Lagre mal
              </button>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Navn på malen..."
                className="w-full py-2 border-b border-bdr text-[0.85rem] outline-none bg-transparent mb-3 text-txt-secondary"
              />
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Emnelinje..."
                className="w-full py-2.5 border-b border-bdr text-base font-medium outline-none bg-transparent mb-4"
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Skriv e-postinnhold her, eller klikk 'Generer' til venstre..."
                className="w-full min-h-[320px] p-4 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none resize-y leading-relaxed focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[0.72rem] text-txt-tertiary mr-1 self-center">Sett inn:</span>
                {MERGE_TAGS.map(tag => (
                  <button key={tag} onClick={() => insertTag(tag)} className="px-2.5 py-0.5 bg-violet-soft text-violet rounded-full text-[0.72rem] font-medium hover:bg-violet hover:text-white transition-all">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-surface-raised border border-bdr rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-bdr bg-surface-sunken">
              <h3 className="text-[0.95rem] font-semibold">Forhåndsvisning</h3>
            </div>
            <div className="p-6">
              {!subject && !body ? (
                <div className="text-center py-12">
                  <Sparkles size={32} className="mx-auto text-txt-tertiary/30 mb-3" />
                  <p className="text-txt-tertiary text-[0.88rem]">Velg et segment og generer en mal, eller skriv din egen</p>
                </div>
              ) : (
                <>
                  <div className="mb-5 text-[0.85rem] text-txt-secondary flex flex-col gap-1">
                    <div><strong className="text-txt-primary font-medium">Til:</strong> erik@cloudway.no</div>
                    <div><strong className="text-txt-primary font-medium">Emne:</strong> <span dangerouslySetInnerHTML={{ __html: renderPreview(subject) }} /></div>
                  </div>
                  <div className="text-[0.9rem] leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderPreview(body) }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
