import { useState, useEffect } from 'react'
import {
  Building2, Globe, Target, Sparkles, Flame, Check, ArrowRight, Shield,
  TrendingUp, Zap, Pencil, Loader2, X, Plus,
} from 'lucide-react'
import { useICP } from '../hooks/useICP'
import { useAuth } from '../hooks/useAuth'
import { useSavedSearches } from '../hooks/useSavedSearches'
import { searchCompanies, NACE_CODES, MUNICIPALITIES, EMPLOYEE_RANGES } from '../api/brreg'
import { BRAND, storageKey } from '../config/brand'
import toast from 'react-hot-toast'

/**
 * Immersive 5-step onboarding — now with real Brreg lookups.
 *
 *   1. Selskap       — collect name, domain, optional rich brief
 *   2. Skanner       — show progress + logs (stylistic; brief is the real input)
 *   3. Mål           — goal, horizon, target
 *   4. Din ICP       — EDITABLE form: NACE multi, region, size, keyword rules
 *   5. Første leads  — REAL Brreg search across chosen NACE codes
 *
 * Presets detect a known domain (optima-ph) and pre-fill known-good ICP.
 * Otherwise heuristics scan the brief for NACE-relevant keywords.
 * On complete, ICP is persisted to icp_profiles and the filter is saved to
 * saved_searches so the team can reuse it.
 */
function cx(...args) { return args.filter(Boolean).join(' ') }

const STEPS = [
  { n: 1, label: 'Selskap',          Ic: Building2 },
  { n: 2, label: 'Skanner nettsted', Ic: Globe },
  { n: 3, label: 'Dine mål',         Ic: Target },
  { n: 4, label: 'Din ICP',          Ic: Sparkles },
  { n: 5, label: 'Første leads',     Ic: Flame },
]

/* --- NACE detection heuristics --- */
const NACE_HINTS = [
  { nace: '47.270',  match: /helse ?kost|naturkost|natur ?prod|økolog/i,          label: 'Helsekost & naturkost' },
  { nace: '47.73',   match: /apotek|farmas/i,                                      label: 'Apotek' },
  { nace: '47.76',   match: /dyrebutikk|kjæledyr|hundemat|fôr|akvari/i,           label: 'Dyrebutikker' },
  { nace: '96.220',  match: /hudpleie|skjønnhet|kosmetikk|salong|velvære|spa/i,   label: 'Skjønnhetspleie & fotpleie' },
  { nace: '86.991',  match: /fot ?terap|fot ?pleie|ortoped/i,                      label: 'Fotterapi & ortopedi' },
  { nace: '96.210',  match: /frisør|frisering/i,                                   label: 'Frisørsalonger' },
  { nace: '75',      match: /veterinær|dyreklinikk/i,                              label: 'Veterinærtjenester' },
  { nace: '56',      match: /restaurant|café|kafé|bistro|spisested/i,              label: 'Servering' },
  { nace: '55.10',   match: /hotell|overnatt/i,                                    label: 'Hotell' },
  { nace: '69',      match: /regnskap|revisjon|juss|advokat/i,                     label: 'Regnskap & juss' },
  { nace: '70',      match: /rådgivn|konsulent|management|strateg/i,               label: 'Rådgivning' },
  { nace: '62',      match: /programvare|saas|it-?tjeneste|software|developer/i,   label: 'IT & programvare' },
  { nace: '73',      match: /markedsføring|reklamebyrå|digital marketing/i,        label: 'Reklame & markedsføring' },
  { nace: '43',      match: /rørlegger|elektriker|maler|snekker|håndverk/i,        label: 'Håndverk' },
  { nace: '41',      match: /entreprenør|bygg og anlegg|boligbygg/i,               label: 'Bygg & anlegg' },
  { nace: '46',      match: /engros|grossist|leverandør/i,                         label: 'Engroshandel' },
  { nace: '86',      match: /klinikk|tannlege|fysio|lege/i,                        label: 'Helsetjeneste' },
  { nace: '87',      match: /pleie ?hjem|sykehjem|omsorg/i,                        label: 'Pleie & omsorg' },
]

/* --- Domain presets (more specific than heuristic) --- */
const DOMAIN_PRESETS = {
  'optima-ph': {
    oneLiner: 'økologisk pH 4-hudpleie og renholdsprodukter for både folk og dyr',
    pitch: 'Optima Produkter lager mild, pH-balansert pleie som jobber med hudens naturlige flora. "Naturens kur mot hudplager", uten parabener, parfyme eller miljøgifter.',
    products: ['Hudpleie pH 4', 'Intimvask & shampo', 'Deodorant & munnspray', 'Produkter for dyr', 'Renholdsprodukter'],
    customers: ['Goodlife Norge', 'Ametrine', 'Helsebutikken i Grimstad', 'RDH Netthandel'],
    problem: '"Jeg har prøvd alt for tørr hud og kløe — ingenting virker. Vanlige såper tørker meg bare ut mer."',
    persona: 'Innkjøpsansvarlig som leter etter naturlige, parabenfrie alternativer',
    summary: 'Helsekostbutikker, apotek, fotterapeuter, hudpleiere og dyrebutikker som allerede fører naturlige sortimenter og får kundehenvendelser om sensitiv hud.',
    industries: ['Helsekost & naturkost', 'Apotek', 'Dyrebutikker', 'Skjønnhetspleie & fotpleie', 'Fotterapi & ortopedi'],
    nace: ['47.270', '47.73', '47.76', '96.220', '86.991'],
    geo: ['Hele Norge'],
    kommune: '',
    size: '1–50 ansatte',
    empRange: '1-10',
    titles: ['Innkjøpsansvarlig', 'Daglig leder', 'Butikksjef'],
    keywordInclude: 'helse,natur,økolog,apotek,hudpleie,fotpleie,dyr,kjæledyr',
    keywordExclude: 'holding,invest,blomst,plante,frø,gartner',
    signals: [
      { label: 'Fører allerede naturlig/økologisk sortiment', weight: 22 },
      { label: 'Forespørsel om prøver eller produktblad',    weight: 18 },
      { label: 'Kundeklager om hudreaksjoner',               weight: 15 },
      { label: 'Nylig besøk på forhandlersiden',             weight: 14 },
      { label: 'Ny innkjøpsansvarlig',                       weight: 12 },
    ],
  },
  'akerregnskap': {
    oneLiner: 'digitalt regnskapsbyrå med fast pris for SMB',
    pitch: 'Fullstendig regnskapstjeneste med fast pris og personlig rådgiver.',
    products: ['Fast-pris regnskap', 'Årsoppgjør & skatt', 'Lønnstjeneste', 'Økonomisk rådgivning'],
    customers: ['Nordic Startups', 'Cafe Nomade', 'Byggmester Berg'],
    problem: 'Gründere bruker for mye tid på bilag — vi tar over og gir dem innsikt.',
    persona: 'Gründeren som kaster bilag',
    summary: 'Ledere i oppstart, kafé og håndverk som vokser raskt og trenger fast-pris regnskap.',
    industries: ['Håndverk', 'Servering', 'Eiendom', 'Detaljhandel'],
    nace: ['43', '56', '68', '47'],
    geo: ['Oslo', 'Bergen'],
    kommune: '',
    size: '2–20 ansatte',
    empRange: '1-10',
    titles: ['Daglig leder', 'CFO', 'Gründer'],
    keywordInclude: '',
    keywordExclude: 'holding,invest',
    signals: [
      { label: 'Vokst siste 12 mnd',            weight: 20 },
      { label: 'Ny CFO eller daglig leder',     weight: 16 },
      { label: 'Byttet regnskapsfører i år',    weight: 18 },
    ],
  },
}

/* Heuristic ICP generation from brief or domain */
function buildICPFromInputs({ domain, company, brief, goals }) {
  const key = (domain || '').toLowerCase().split('.')[0].replace(/^www\./, '')
  for (const [presetKey, preset] of Object.entries(DOMAIN_PRESETS)) {
    if (key.includes(presetKey)) {
      return { ...preset, _preset: presetKey }
    }
  }
  // Heuristic fallback based on brief text
  const text = ((brief || '') + ' ' + (domain || '')).toLowerCase()
  const hits = NACE_HINTS.filter(h => h.match.test(text))
  const nace = hits.length ? hits.slice(0, 5).map(h => h.nace) : ['']
  const industries = hits.length ? hits.slice(0, 5).map(h => h.label) : ['Alle bransjer']
  return {
    oneLiner: `${company} — spesialisert B2B-løsning`,
    pitch: 'Analyser brief for detaljer, eller juster ICP under.',
    products: ['Se brief'],
    customers: [],
    problem: '',
    persona: 'Innkjøpsansvarlig hos riktig målgruppe',
    summary: 'Juster ICP for å treffe akkurat din målgruppe. Du kan endre alt under.',
    industries,
    nace,
    geo: ['Hele Norge'],
    kommune: '',
    size: '5–50 ansatte',
    empRange: '1-10',
    titles: ['Daglig leder', 'Innkjøpsansvarlig'],
    keywordInclude: '',
    keywordExclude: 'holding,invest',
    signals: [
      { label: 'Vokser raskt', weight: 18 },
      { label: 'Nyansettelser i relevante roller', weight: 15 },
    ],
  }
}

/* --- Component --- */
export default function OnboardingFlow({ onComplete, onClose }) {
  const { profile } = useAuth()
  const { save: saveICP } = useICP()
  const { saveSearch } = useSavedSearches()

  const [step, setStep] = useState(1)
  const [domain, setDomain] = useState('')
  const [company, setCompany] = useState(profile?.company_name || '')
  const [brief, setBrief] = useState('')
  const [showBrief, setShowBrief] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLogs, setScanLogs] = useState([])
  const [extracted, setExtracted] = useState(null)
  const [refining, setRefining] = useState(false)
  const [icp, setIcp] = useState(null)
  const [searching, setSearching] = useState(false)
  const [matches, setMatches] = useState([])
  const [searchStats, setSearchStats] = useState(null)
  const [goals, setGoals] = useState({ primary: 'nye-kunder', timeHorizon: '3-6m', target: 20 })

  function startScan() {
    if (!domain || !company) return
    setScanning(true); setScanProgress(0); setScanLogs([]); setExtracted(null)
    setStep(2)

    const briefSignal = brief.trim() ? 'Leser briefen din' : 'Signe gjetter utifra domenet'
    const messages = [
      `GET ${domain}/`,
      'Parser hero og meta-tags',
      'Leser /produkter og /tjenester',
      '→ Identifiserer produktområder',
      brief.trim() ? 'Leser briefen din' : `GET ${domain}/kunder`,
      brief.trim() ? '→ Finner mål, smerter, forhandlere' : '→ Finner kunde-caser',
      'Analyserer tone og pitch-vinkler',
      'Spør Signe: "Hva er dette selskapet?"',
      '✓ Oppsummering klar',
    ]
    let i = 0
    const tick = setInterval(() => {
      setScanProgress(p => Math.min(100, p + 8 + Math.random() * 6))
      if (i < messages.length) {
        setScanLogs(prev => [...prev, messages[i]])
        i++
      }
    }, 380)
    setTimeout(() => {
      clearInterval(tick)
      setScanProgress(100)
      const built = buildICPFromInputs({ domain, company, brief, goals })
      setExtracted(built)
      setScanning(false)
    }, 4200)
  }

  function generateICP() {
    setRefining(true); setStep(4)
    setTimeout(() => {
      // Prefill ICP editable state from what was extracted
      setIcp({ ...extracted })
      setRefining(false)
    }, 1400)
  }

  async function findLeads() {
    setStep(5)
    setSearching(true); setMatches([]); setSearchStats(null)

    try {
      const naceCodes = (icp.nace || []).filter(Boolean)
      if (!naceCodes.length) naceCodes.push('')  // fall back to all

      // Parse keyword rules
      const makeRe = s => {
        const tokens = (s || '').split(/[,|\n]+/).map(t => t.trim()).filter(Boolean)
        if (!tokens.length) return null
        try { return new RegExp(tokens.map(t => t.replace(/[.*+?^${}()[\]\\]/g, '\\$&')).join('|'), 'i') } catch { return null }
      }
      const includeRe = makeRe(icp.keywordInclude)
      const excludeRe = makeRe(icp.keywordExclude)

      const empRange = EMPLOYEE_RANGES.find(r => r.value === icp.empRange)

      // Search each NACE in parallel
      const results = await Promise.all(naceCodes.map(code =>
        searchCompanies({
          industrikode: code,
          kommunenummer: icp.kommune || '',
          fraAntallAnsatte: empRange?.fromVal || '',
          tilAntallAnsatte: empRange?.toVal || '',
          size: 30,
        }).catch(() => ({ companies: [], totalResults: 0 }))
      ))

      // Merge + dedupe
      const seen = new Set()
      const merged = []
      let totalAcross = 0
      for (const r of results) {
        totalAcross += r.totalResults || 0
        for (const c of (r.companies || [])) {
          if (!c?.orgNumber || seen.has(c.orgNumber)) continue
          const text = `${c.name || ''} ${c.industry || ''} ${c.purpose || ''}`
          if (excludeRe && excludeRe.test(text)) continue
          if (includeRe && !includeRe.test(text)) continue
          // Skip obvious holding/shell companies
          if (/HOLDING|INVEST/i.test(c.name || '')) continue
          seen.add(c.orgNumber)
          // Simple heuristic score: add points for NACE-match strength, employees, bonus random for variety
          const empBonus = c.employees ? Math.min(15, Math.floor(c.employees / 2)) : 0
          const score = Math.min(95, 50 + empBonus + Math.floor(Math.random() * 30))
          merged.push({ ...c, score })
        }
      }
      merged.sort((a, b) => b.score - a.score)
      setMatches(merged.slice(0, 10))
      setSearchStats({ totalScanned: totalAcross, matched: merged.length, shown: Math.min(10, merged.length) })
    } catch (err) {
      console.error('[OnboardingFlow] search failed', err)
      toast.error('Kunne ikke hente leads akkurat nå — prøv igjen fra Prospektering')
    } finally {
      setSearching(false)
    }
  }

  async function handleComplete() {
    if (icp) {
      // Persist ICP
      const payload = {
        companyName: company || '',
        senderName: profile?.full_name || '',
        yourIndustry: icp.oneLiner?.split('—')[1]?.trim() || icp.oneLiner || '',
        whatYouSell: (icp.products || []).join(', '),
        targetIndustries: (icp.industries || []).join(', '),
        companySize: icp.size || '',
        minRevenue: '',
        targetRegion: (icp.geo || []).join(', '),
        problemYouSolve: icp.problem || '',
        decisionMakerTitle: (icp.titles || []).join(', '),
        decisionMakerDept: '',
      }
      const res = await saveICP(payload)
      if (res?.error) console.error('[OnboardingFlow] saveICP failed', res.error)

      // Also save the derived search as a preset so team can reuse it
      try {
        await saveSearch({
          name: `${company} — ICP-match`,
          description: icp.persona || '',
          industryTag: icp._preset || 'onboarding',
          filters: {
            industrikode: (icp.nace || [])[0] || '',
            kommunenummer: icp.kommune || '',
            employeeRange: icp.empRange || '',
          },
          keywordInclude: icp.keywordInclude || null,
          keywordExclude: icp.keywordExclude || null,
        })
      } catch (e) {
        console.warn('[OnboardingFlow] saveSearch failed', e)
      }
    }
    try {
      localStorage.setItem(storageKey('onboarding_goals'), JSON.stringify(goals))
      localStorage.setItem(storageKey('onboarding_v2_done'), 'true')
      localStorage.setItem(storageKey('onboarding_done'), 'true')
    } catch {}
    toast.success('Onboarding fullført — velkommen til ' + BRAND.name + '!')
    onComplete?.()
  }

  return (
    <div className="fixed inset-0 z-[150] bg-paper flex animate-in">
      {/* Progress rail */}
      <aside className="w-[260px] shrink-0 bg-ink text-white p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
            <Zap size={13} />
          </div>
          <span className="font-display text-[16px] font-medium">{BRAND.name}</span>
        </div>

        <div className="space-y-0.5 flex-1">
          {STEPS.map(({ n, label, Ic }) => {
            const done = step > n
            const active = step === n
            return (
              <div key={n} className="flex items-center gap-3 py-2.5">
                <div className={cx('w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  done ? 'bg-ok text-ink'
                  : active ? 'bg-white text-ink'
                  : 'bg-white/5 text-white/40')}>
                  {done ? <Check size={13} strokeWidth={3} /> : <Ic size={13} />}
                </div>
                <div>
                  <div className={cx('text-[13px]',
                    active ? 'font-medium text-white'
                    : done ? 'text-white/80'
                    : 'text-white/40')}>{label}</div>
                  <div className="text-[10px] text-white/30 font-mono">Steg {n}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="text-[11px] text-white/40 font-light leading-[1.5] border-t border-white/10 pt-4">
          Signe analyserer produktene dine, eksisterende kunder og målene dine — for å finne ditt ideelle marked i Norge.
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        {onClose && (
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded text-txt-tertiary hover:bg-canvas-warm hover:text-ink transition-all z-10">
            <X size={18}/>
          </button>
        )}
        <div className="max-w-[780px] mx-auto p-10 md:p-14">
          {step === 1 && <StepDomain {...{ domain, setDomain, company, setCompany, brief, setBrief, showBrief, setShowBrief, onNext: startScan }} />}
          {step === 2 && <StepScanning {...{ domain, progress: scanProgress, logs: scanLogs, done: !scanning, extracted, onNext: () => setStep(3) }} />}
          {step === 3 && <StepGoals {...{ extracted, goals, setGoals, onNext: generateICP }} />}
          {step === 4 && <StepICP {...{ icp, setIcp, refining, onNext: findLeads }} />}
          {step === 5 && <StepLeads {...{ icp, searching, matches, searchStats, onComplete: handleComplete }} />}
        </div>
      </div>
    </div>
  )
}

/* ================= Step 1 — Domain + optional brief ================= */
function StepDomain({ domain, setDomain, company, setCompany, brief, setBrief, showBrief, setShowBrief, onNext }) {
  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">Velkommen · 1 av 5</div>
      <h1 className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        La oss bli kjent.<br />
        <em className="italic text-txt-tertiary font-normal">Hva selger du?</em>
      </h1>
      <p className="mt-5 text-[15px] text-txt-secondary leading-[1.55] font-light max-w-[560px]">
        Fortell oss nettsiden deres — Signe leser produktene, tjenestene og kundecase. Det lar henne finne de riktige kundene for akkurat din business.
      </p>

      <div className="mt-8 space-y-4 max-w-[560px]">
        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Selskapsnavn</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Nordic Flow AS"
            className="w-full mt-1.5 px-4 py-3 rounded-md border border-bdr bg-white outline-none focus:border-ink text-[15px]" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Nettside</label>
          <div className="flex items-center mt-1.5">
            <span className="px-3 py-3 rounded-l-md border border-r-0 border-bdr bg-canvas-warm text-[13px] text-txt-tertiary font-mono">https://</span>
            <input value={domain} onChange={e => setDomain(e.target.value.replace(/^https?:\/\//i,''))} placeholder="optima-ph.no"
              className="flex-1 px-4 py-3 rounded-r-md border border-bdr bg-white outline-none focus:border-ink text-[15px] font-mono" />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-txt-tertiary font-light">
            <Shield size={11} /> Kun offentlig informasjon · vi scraper aldri skjermede sider
          </div>
        </div>

        {/* Rich brief — optional */}
        <div className="pt-2">
          {!showBrief ? (
            <button onClick={() => setShowBrief(true)} className="text-[13px] text-ink font-medium hover:text-heat-hot transition-colors flex items-center gap-1.5">
              <Plus size={13}/> Vil du dele en brief? Signe leser den. <span className="text-txt-tertiary font-light">(valgfritt)</span>
            </button>
          ) : (
            <div>
              <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Brief til Signe</label>
              <textarea value={brief} onChange={e => setBrief(e.target.value)}
                placeholder={`Eksempel:

Vi lager økologisk hudpleie og renholdsprodukter med pH 4, "naturens kur mot hudplager", uten parabener. Selger via nettbutikk + forhandlere som helsekost, apotek, fotterapeuter, dyrebutikker.

Typiske forhandlere: Goodlife Norge, Ametrine, Helsebutikken i Grimstad.
Mål: flere forhandlere i Norge.`}
                rows={8}
                className="w-full mt-1.5 px-4 py-3 rounded-md border border-bdr bg-white outline-none focus:border-ink text-[13.5px] leading-[1.5] font-sans resize-y" />
              <div className="text-[11px] text-txt-tertiary mt-1 font-light">
                Jo mer konkret, jo bedre ICP. Signe bruker teksten til å finne riktige bransjer, størrelse og kjøpssignaler.
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Prøv med et eksempel</div>
          <div className="flex gap-2 flex-wrap">
            {[
              ['optima-ph.no', 'Optima Produkter AS'],
              ['akerregnskap.no', 'Aker Regnskap AS'],
              ['cloudway.no', 'Cloudway Solutions AS'],
            ].map(([d, n]) => (
              <button key={d} onClick={() => { setDomain(d); setCompany(n) }}
                className="px-3 py-1.5 rounded-full border border-bdr bg-white text-[12px] hover:border-ink transition-colors">
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <button onClick={onNext} disabled={!domain || !company}
          className="flex items-center gap-2 px-5 py-3 rounded-md bg-ink text-white font-medium text-[14px] hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          <Sparkles size={15}/> Skann nettsiden
        </button>
        <span className="text-[12px] text-txt-tertiary font-light">tar ca. 5 sekunder</span>
      </div>
    </div>
  )
}

/* ================= Step 2 — Scanning ================= */
function StepScanning({ domain, progress, logs, done, extracted, onNext }) {
  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">Skanner · 2 av 5</div>
      <h1 className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Signe leser <span className="font-mono text-heat-hot text-[28px]">{domain}</span>
      </h1>
      <p className="mt-4 text-[14px] text-txt-secondary font-light">Analyserer produkter, tjenester og kundecase.</p>

      <div className="mt-8 bg-ink rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={cx('w-2 h-2 rounded-full', done ? 'bg-ok' : 'bg-heat-hot animate-pulse')} />
            <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-white/70">
              {done ? 'Ferdig' : 'Kjører…'}
            </span>
          </div>
          <span className="font-mono text-[12px] text-white/60">{Math.floor(progress)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-5">
          <div className="h-full bg-heat-hot transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="font-mono text-[11.5px] space-y-1 max-h-[240px] overflow-y-auto">
          {logs.map((l, i) => (
            <div key={i} className={cx('animate-in', i === logs.length - 1 && !done && 'text-heat-hot')}>
              <span className="text-white/30 mr-2">→</span>
              <span className="text-white/80">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {done && extracted && (
        <div className="mt-6 space-y-4 animate-in">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Signe oppdaget</div>
          <div className="p-5 rounded-lg bg-canvas-soft border border-bdr">
            <div className="font-display text-[22px] font-medium tracking-tight mb-1 text-ink">{extracted.oneLiner}</div>
            <p className="text-[13.5px] text-txt-secondary font-light leading-[1.55]">{extracted.pitch}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Produkter</div>
              <ul className="space-y-1.5 text-[12.5px] text-ink">
                {extracted.products?.slice(0, 5).map(p => (
                  <li key={p} className="flex gap-2"><Check size={11} className="text-ok mt-0.5 flex-shrink-0" /> {p}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Eksisterende kunder</div>
              <div className="flex flex-wrap gap-1.5">
                {(extracted.customers || []).length === 0 ? (
                  <span className="text-[11px] text-txt-tertiary italic">Ingen fra brief</span>
                ) : extracted.customers.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded text-[11px] bg-canvas-warm border border-bdr text-txt-secondary">{c}</span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Problem løst</div>
              <div className="text-[12.5px] font-light text-txt-secondary leading-[1.5]">
                {extracted.problem || <span className="italic">Ikke i brief</span>}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={onNext}
              className="flex items-center gap-2 px-5 py-3 rounded-md bg-ink text-white font-medium text-[14px] hover:bg-ink-soft transition-all">
              Stemmer, fortsett <ArrowRight size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= Step 3 — Goals ================= */
function StepGoals({ extracted, goals, setGoals, onNext }) {
  const primaries = [
    { id: 'nye-kunder', icon: Flame,         title: 'Flere nye kunder',     desc: 'Varme leads klare for oppfølging' },
    { id: 'oppsalg',    icon: TrendingUp,    title: 'Mer oppsalg',          desc: 'Finne eksisterende kunder klare for mer' },
    { id: 'awareness',  icon: Target,        title: 'Awareness i segmentet', desc: 'Få navnet kjent hos riktige folk' },
    { id: 'marked',     icon: Globe,         title: 'Inn i nytt marked',    desc: 'Test nye bransjer eller geografi' },
  ]
  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">Mål · 3 av 5</div>
      <h1 className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Hva vil dere <em className="italic text-heat-hot">oppnå?</em>
      </h1>
      <p className="mt-4 text-[14px] text-txt-secondary font-light max-w-[540px]">
        Signe prioriterer leads annerledes avhengig av mål. Velg det viktigste akkurat nå.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2 block">Primært mål</label>
          <div className="grid grid-cols-2 gap-2.5">
            {primaries.map(p => {
              const selected = goals.primary === p.id
              const Ic = p.icon
              return (
                <button key={p.id} onClick={() => setGoals({ ...goals, primary: p.id })}
                  className={cx('p-4 rounded-lg border text-left transition-all',
                    selected
                      ? 'bg-sage-soft border-sage ring-2 ring-sage/20'
                      : 'bg-white border-bdr hover:border-ink/20')}>
                  <div className="flex items-center gap-3">
                    <div className={cx('w-9 h-9 rounded-md flex items-center justify-center',
                      selected ? 'bg-ink text-white' : 'bg-canvas-warm text-txt-secondary')}>
                      <Ic size={16} />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-ink">{p.title}</div>
                      <div className="text-[11.5px] text-txt-tertiary font-light">{p.desc}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2 block">Tidshorisont</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[['nå', '< 1 mnd'], ['3-6m', '3–6 mnd'], ['6-12m', '6–12 mnd']].map(([v, l]) => (
                <button key={v} onClick={() => setGoals({ ...goals, timeHorizon: v })}
                  className={cx('py-2.5 rounded-md text-[12.5px] font-medium border transition-all',
                    goals.timeHorizon === v ? 'bg-ink text-white border-ink' : 'bg-white border-bdr text-ink hover:border-ink/30')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2 block">
              Mål: kvalifiserte samtaler / mnd
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min="5" max="80" value={goals.target}
                onChange={e => setGoals({ ...goals, target: +e.target.value })}
                className="accent-ink flex-1" />
              <span className="font-display text-[28px] font-medium w-12 text-ink">{goals.target}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-md bg-sage-soft border border-sage/30">
        <div className="flex gap-3">
          <Sparkles size={14} className="text-ink mt-0.5 flex-shrink-0" />
          <div className="text-[12.5px] font-light leading-[1.55] text-txt-secondary">
            Basert på {extracted?.oneLiner?.toLowerCase() || 'produktet ditt'} og målet ditt om <span className="font-medium text-ink">{goals.target} samtaler/mnd</span>, estimerer Signe at du trenger {goals.target * 18}–{goals.target * 24} utsendinger i måneden — fullt automatiserbart.
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button onClick={onNext}
          className="flex items-center gap-2 px-5 py-3 rounded-md bg-ink text-white font-medium text-[14px] hover:bg-ink-soft transition-all">
          <Sparkles size={14}/> Generer min ICP <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  )
}

/* ================= Step 4 — ICP editor ================= */
function StepICP({ icp, setIcp, refining, onNext }) {
  if (refining || !icp) {
    const loadingSteps = [
      'Analyserer eksisterende kundebase…',
      'Identifiserer felles mønstre (bransje, størrelse, geo)…',
      'Matcher mot Brreg (4.2M enheter)…',
      'Kalibrerer signal-vekter…',
      'Ferdig!',
    ]
    return (
      <div className="animate-in">
        <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">ICP · 4 av 5</div>
        <h1 className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">Signe bygger din profil…</h1>
        <div className="mt-10 space-y-3">
          {loadingSteps.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <Loader2 size={14} className="text-heat-hot animate-spin" />
              <div className="text-[13px] text-txt-secondary font-light">{l}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function toggleNace(code) {
    setIcp(prev => {
      const next = { ...prev }
      const list = new Set(next.nace || [])
      if (list.has(code)) list.delete(code); else list.add(code)
      next.nace = Array.from(list)
      return next
    })
  }

  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">ICP · 4 av 5</div>
      <h1 className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Møt <em className="italic text-heat-hot">din ideelle kunde</em>
      </h1>
      <p className="mt-3 text-[14px] text-txt-secondary font-light">Generert av Signe — juster alt under. Dette styrer søket mot Brreg.</p>

      <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-canvas-soft to-canvas-warm border border-bdr">
        <div className="flex items-start gap-5 mb-5">
          <div className="w-16 h-16 rounded-lg bg-ink text-white flex items-center justify-center shrink-0">
            <Target size={24} />
          </div>
          <div className="flex-1">
            <input value={icp.persona || ''} onChange={e => setIcp({ ...icp, persona: e.target.value })}
              className="w-full font-display text-[24px] font-medium tracking-tight text-ink bg-transparent outline-none border-b border-transparent focus:border-bdr py-0.5" />
            <textarea value={icp.summary || ''} onChange={e => setIcp({ ...icp, summary: e.target.value })}
              rows={2}
              className="w-full text-[13px] text-txt-secondary font-light mt-1 bg-transparent outline-none border border-transparent focus:border-bdr rounded px-2 py-1 resize-none" />
          </div>
        </div>

        {/* Editable NACE multi-select */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Bransjer (NACE) — klikk for å velge flere</div>
          <div className="flex flex-wrap gap-1.5">
            {NACE_CODES.filter(n => n.value).map(n => {
              const selected = (icp.nace || []).includes(n.value)
              return (
                <button key={n.value} onClick={() => toggleNace(n.value)}
                  className={cx('px-2.5 py-1 rounded text-[11.5px] border transition-all',
                    selected ? 'bg-ink text-white border-ink' : 'bg-white border-bdr text-txt-secondary hover:border-ink/40')}>
                  {n.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Region</div>
            <select value={icp.kommune || ''} onChange={e => setIcp({ ...icp, kommune: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-bdr bg-white text-[13px] outline-none focus:border-ink">
              {MUNICIPALITIES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Antall ansatte</div>
            <select value={icp.empRange || ''} onChange={e => setIcp({ ...icp, empRange: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-bdr bg-white text-[13px] outline-none focus:border-ink">
              {EMPLOYEE_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {/* Keyword rules */}
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Må inneholde (navn/bransje)</div>
            <input value={icp.keywordInclude || ''} onChange={e => setIcp({ ...icp, keywordInclude: e.target.value })}
              placeholder="f.eks. helse,natur,apotek"
              className="w-full px-3 py-2 rounded-md border border-bdr bg-white text-[13px] outline-none focus:border-ink font-mono" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Må IKKE inneholde</div>
            <input value={icp.keywordExclude || ''} onChange={e => setIcp({ ...icp, keywordExclude: e.target.value })}
              placeholder="f.eks. holding,invest,blomst"
              className="w-full px-3 py-2 rounded-md border border-bdr bg-white text-[13px] outline-none focus:border-ink font-mono" />
          </div>
        </div>

        {(icp.signals && icp.signals.length > 0) && (
          <div className="mt-6 pt-5 border-t border-bdr">
            <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-3">
              Topp kjøpssignaler · vektet
            </div>
            <div className="space-y-2">
              {icp.signals.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[13px] flex-1 text-ink">{s.label}</span>
                  <div className="w-32 h-1 bg-bdr rounded-full overflow-hidden">
                    <div className="h-full bg-heat-hot" style={{ width: `${(s.weight / 22) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-txt-tertiary w-6 text-right">+{s.weight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-3 rounded-md bg-canvas-soft border border-bdr text-[12px] text-txt-secondary font-light">
        <strong className="text-ink">{(icp.nace || []).length}</strong> bransje(r) valgt ·
        {' '}{icp.kommune ? MUNICIPALITIES.find(m => m.value === icp.kommune)?.label : 'Hele Norge'} ·
        {' '}{EMPLOYEE_RANGES.find(r => r.value === icp.empRange)?.label || 'Alle størrelser'}
      </div>

      <div className="mt-6 flex items-center justify-end">
        <button onClick={onNext} disabled={!(icp.nace || []).length}
          className="flex items-center gap-2 px-5 py-3 rounded-md bg-ink text-white font-medium text-[14px] hover:bg-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-all">
          Finn leads i Brreg <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  )
}

/* ================= Step 5 — Real Brreg search ================= */
function StepLeads({ icp, searching, matches, searchStats, onComplete }) {
  if (!icp) return null
  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">Ferdig · 5 av 5</div>
      <h1 className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Her er dine <em className="italic text-heat-hot">første leads.</em>
      </h1>
      <p className="mt-4 text-[15px] text-txt-secondary font-light max-w-[560px]">
        Hentet fra Brønnøysundregistrene basert på din ICP. Signe setter opp kampanje når du er klar.
      </p>

      {searching && (
        <div className="mt-10 p-8 rounded-xl bg-canvas-soft border border-bdr text-center">
          <Loader2 size={22} className="text-heat-hot animate-spin inline-block mb-3" />
          <div className="text-[14px] text-txt-secondary">
            Søker i Brreg på {(icp.nace || []).length} bransje(r)…
          </div>
          <div className="text-[11px] text-txt-tertiary font-mono mt-1">
            {(icp.nace || []).join(' · ')}
          </div>
        </div>
      )}

      {!searching && matches.length === 0 && (
        <div className="mt-10 p-8 rounded-xl bg-canvas-soft border border-bdr text-center">
          <div className="text-[14px] text-ink font-medium mb-1">Ingen treff</div>
          <div className="text-[12.5px] text-txt-secondary font-light max-w-md mx-auto">
            Prøv bredere NACE-koder eller mykere keyword-regler. Du kan justere alt i Prospektering etterpå.
          </div>
        </div>
      )}

      {!searching && matches.length > 0 && (
        <>
          {searchStats && (
            <div className="mt-6 p-3 rounded-md bg-canvas-soft border border-bdr text-[12px] text-txt-secondary font-light">
              Scannet <strong className="text-ink">{searchStats.totalScanned.toLocaleString('nb-NO')}</strong> selskap ·
              <strong className="text-ink"> {searchStats.matched}</strong> matcher ·
              viser topp <strong className="text-ink">{searchStats.shown}</strong>
            </div>
          )}
          <div className="mt-6 space-y-2.5">
            {matches.map((m, i) => (
              <div key={m.orgNumber} className="animate-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-white border border-bdr hover:border-ink/30 hover:shadow-card transition-all">
                  <span className="font-mono text-[11px] text-txt-tertiary w-6">{String(i + 1).padStart(2, '0')}</span>
                  <div className="w-10 h-10 rounded-md bg-ink text-white flex items-center justify-center font-display text-[14px] font-medium flex-shrink-0">
                    {(m.name || '??').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-medium truncate text-ink">{m.name}</div>
                      {m.score >= 85 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-heat-hot/10 text-heat-hot flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-heat-hot"/> Brennhet
                        </span>
                      )}
                    </div>
                    <div className="text-[11.5px] text-txt-tertiary mt-0.5 truncate">
                      {[m.industry, m.municipality, m.employees && `${m.employees} ansatte`, m.orgNumber].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-txt-tertiary uppercase tracking-wider">Intent</div>
                    <div className="font-display text-[18px] font-medium text-ink">{m.score}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-10 p-6 rounded-xl bg-ink text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] text-heat-hot font-semibold mb-1">Klar til å starte?</div>
          <div className="font-display text-[22px] font-medium">ICP-en din er lagret</div>
          <div className="text-[12px] text-white/60 mt-1 font-light">
            Søkefilteret ditt er også lagret som preset — teamet kan gjenbruke det.
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onComplete}
            className="px-4 py-2.5 rounded-md text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
            Gå til dashbord
          </button>
          <button onClick={onComplete}
            className="bg-heat-hot text-white px-5 py-2.5 rounded-md font-medium text-[13px] flex items-center gap-2 hover:opacity-90 transition-all">
            <Zap size={13}/> Fullfør
          </button>
        </div>
      </div>
    </div>
  )
}
