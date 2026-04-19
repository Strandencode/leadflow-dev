import { useState, useEffect } from 'react'
import {
  Building2, Globe, Target, Sparkles, Flame, Check, ArrowRight, Shield,
  TrendingUp, Zap, Pencil, Loader2, X,
} from 'lucide-react'
import { useICP } from '../hooks/useICP'
import { useAuth } from '../hooks/useAuth'
import { BRAND, storageKey } from '../config/brand'
import toast from 'react-hot-toast'

/**
 * Immersive 5-step onboarding that replaces the old OnboardingWizard for
 * brand-new workspaces. Modeled on the Vekstor prototype:
 *
 *   1. Selskap     — collect company name + domain
 *   2. Skanner     — mock a website scan to show "we're extracting your story"
 *   3. Mål         — user picks primary goal + horizon + target
 *   4. ICP         — generated persona + industries + signals
 *   5. Leads       — first 10 matched leads preview
 *
 * On complete it persists:
 *   - company/domain → profile (company_name)
 *   - generated ICP → icp_profiles (whatYouSell, targetIndustries, etc.)
 *   - goals + completion flag → localStorage
 *
 * Shown as a full-screen overlay, not a modal — first impression is big.
 */
function cx(...args) { return args.filter(Boolean).join(' ') }

const STEPS = [
  { n: 1, label: 'Selskap',          Ic: Building2 },
  { n: 2, label: 'Skanner nettsted', Ic: Globe },
  { n: 3, label: 'Dine mål',         Ic: Target },
  { n: 4, label: 'Din ICP',          Ic: Sparkles },
  { n: 5, label: 'Første leads',     Ic: Flame },
]

export default function OnboardingFlow({ onComplete, onClose }) {
  const { profile } = useAuth()
  const { save: saveICP } = useICP()

  const [step, setStep] = useState(1)
  const [domain, setDomain] = useState('')
  const [company, setCompany] = useState(profile?.company_name || '')
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLogs, setScanLogs] = useState([])
  const [extracted, setExtracted] = useState(null)
  const [refining, setRefining] = useState(false)
  const [icp, setIcp] = useState(null)
  const [matches, setMatches] = useState([])
  const [goals, setGoals] = useState({ primary: 'nye-kunder', timeHorizon: '3-6m', target: 20 })

  function startScan() {
    if (!domain || !company) return
    setScanning(true); setScanProgress(0); setScanLogs([]); setExtracted(null)
    setStep(2)

    const messages = [
      `GET ${domain}/`,
      'Parser hero og meta-tags',
      'Leser /produkter og /tjenester',
      '→ Identifiserer 3 produktområder',
      `GET ${domain}/kunder`,
      '→ Finner 8 kunde-caser',
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
      setExtracted(mockExtract(domain, company))
      setScanning(false)
    }, 4200)
  }

  function generateICP() {
    setRefining(true); setStep(4)
    setTimeout(() => {
      const generated = mockICP(extracted, goals)
      setIcp(generated)
      setRefining(false)
    }, 1800)
  }

  function findLeads() {
    setStep(5)
    setTimeout(() => setMatches(mockMatches(icp)), 1400)
  }

  async function handleComplete() {
    // Persist ICP from wizard output
    if (icp) {
      const payload = {
        companyName: company || '',
        senderName: profile?.full_name || '',
        yourIndustry: extracted?.oneLiner?.split('—')[1]?.trim() || '',
        whatYouSell: extracted?.products?.join(', ') || '',
        targetIndustries: icp.industries.join(', '),
        companySize: icp.size || '',
        minRevenue: '',
        targetRegion: icp.geo?.join(', ') || '',
        problemYouSolve: extracted?.problem || '',
        decisionMakerTitle: icp.titles?.join(', ') || '',
        decisionMakerDept: '',
      }
      const res = await saveICP(payload)
      if (res?.error) {
        console.error('[OnboardingFlow] saveICP failed', res.error)
      }
    }
    // Persist goals locally for future reference
    try {
      localStorage.setItem(storageKey('onboarding_goals'), JSON.stringify(goals))
      localStorage.setItem(storageKey('onboarding_v2_done'), 'true')
      // Remove legacy flag too so the old wizard never pops up again
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
                <div className={cx(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  done ? 'bg-ok text-ink'
                  : active ? 'bg-white text-ink'
                  : 'bg-white/5 text-white/40'
                )}>
                  {done ? <Check size={13} strokeWidth={3} /> : <Ic size={13} />}
                </div>
                <div>
                  <div className={cx(
                    'text-[13px]',
                    active ? 'font-medium text-white'
                    : done ? 'text-white/80'
                    : 'text-white/40'
                  )}>{label}</div>
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
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded text-txt-tertiary hover:bg-canvas-warm hover:text-ink transition-all">
            <X size={18}/>
          </button>
        )}
        <div className="max-w-[780px] mx-auto p-10 md:p-14">
          {step === 1 && <StepDomain {...{ domain, setDomain, company, setCompany, onNext: startScan }} />}
          {step === 2 && <StepScanning {...{ domain, progress: scanProgress, logs: scanLogs, done: !scanning, extracted, onNext: () => setStep(3) }} />}
          {step === 3 && <StepGoals {...{ extracted, goals, setGoals, onNext: generateICP }} />}
          {step === 4 && <StepICP {...{ icp, refining, onNext: findLeads }} />}
          {step === 5 && <StepLeads {...{ icp, matches, onComplete: handleComplete }} />}
        </div>
      </div>
    </div>
  )
}

/* ================= Step 1 — Domain ================= */
function StepDomain({ domain, setDomain, company, setCompany, onNext }) {
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

      <div className="mt-8 space-y-4 max-w-[520px]">
        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Selskapsnavn</label>
          <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Nordic Flow AS"
            className="w-full mt-1.5 px-4 py-3 rounded-md border border-bdr bg-white outline-none focus:border-ink text-[15px]" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary">Nettside</label>
          <div className="flex items-center mt-1.5">
            <span className="px-3 py-3 rounded-l-md border border-r-0 border-bdr bg-canvas-warm text-[13px] text-txt-tertiary font-mono">https://</span>
            <input value={domain} onChange={e => setDomain(e.target.value.replace(/^https?:\/\//i,''))} placeholder="nordicflow.no"
              className="flex-1 px-4 py-3 rounded-r-md border border-bdr bg-white outline-none focus:border-ink text-[15px] font-mono" />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-txt-tertiary font-light">
            <Shield size={11} /> Kun offentlig informasjon · vi scraper aldri skjermede sider
          </div>
        </div>

        <div className="pt-4">
          <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Prøv med et eksempel</div>
          <div className="flex gap-2 flex-wrap">
            {[
              ['akerregnskap.no', 'Aker Regnskap AS'],
              ['cloudway.no', 'Cloudway Solutions AS'],
              ['nordicflow.no', 'Nordic Flow AS'],
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
                {extracted.products.map(p => (
                  <li key={p} className="flex gap-2"><Check size={11} className="text-ok mt-0.5 flex-shrink-0" /> {p}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Eksisterende kunder</div>
              <div className="flex flex-wrap gap-1.5">
                {extracted.customers.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded text-[11px] bg-canvas-warm border border-bdr text-txt-secondary">{c}</span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
              <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-2">Problem løst</div>
              <div className="text-[12.5px] font-light text-txt-secondary leading-[1.5]">"{extracted.problem}"</div>
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
                  className={cx(
                    'p-4 rounded-lg border text-left transition-all',
                    selected
                      ? 'bg-sage-soft border-sage ring-2 ring-sage/20'
                      : 'bg-white border-bdr hover:border-ink/20'
                  )}>
                  <div className="flex items-center gap-3">
                    <div className={cx(
                      'w-9 h-9 rounded-md flex items-center justify-center',
                      selected ? 'bg-ink text-white' : 'bg-canvas-warm text-txt-secondary'
                    )}>
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
                  className={cx(
                    'py-2.5 rounded-md text-[12.5px] font-medium border transition-all',
                    goals.timeHorizon === v ? 'bg-ink text-white border-ink' : 'bg-white border-bdr text-ink hover:border-ink/30'
                  )}>
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

/* ================= Step 4 — ICP ================= */
function StepICP({ icp, refining, onNext }) {
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

  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">ICP · 4 av 5</div>
      <h1 className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Møt <em className="italic text-heat-hot">din ideelle kunde</em>
      </h1>
      <p className="mt-3 text-[14px] text-txt-secondary font-light">Generert av Signe — juster fritt i etterkant.</p>

      <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-canvas-soft to-canvas-warm border border-bdr">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-lg bg-ink text-white flex items-center justify-center shrink-0">
            <Target size={24} />
          </div>
          <div className="flex-1">
            <div className="font-display text-[24px] font-medium tracking-tight text-ink">{icp.persona}</div>
            <div className="text-[13px] text-txt-secondary font-light mt-1">{icp.summary}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <ICPSection label="Bransjer" items={icp.industries} />
          <ICPSection label="Størrelse" items={[icp.size]} />
          <ICPSection label="Geografi" items={icp.geo} />
          <ICPSection label="Beslutningstakere" items={icp.titles} />
        </div>

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
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Potensielt marked" value={icp.marketSize.toLocaleString('nb-NO')} unit="selskap" />
        <Stat label="Matcher ICP nå" value={icp.matchesNow.toLocaleString('nb-NO')} unit="selskap" />
        <Stat label="Høy intent i dag" value={icp.hotToday} unit="leads" />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-md border border-bdr bg-white text-[13px] font-medium text-ink hover:bg-canvas-warm transition-all">
          <Pencil size={13}/> Juster ICP manuelt
        </button>
        <button onClick={onNext}
          className="flex items-center gap-2 px-5 py-3 rounded-md bg-ink text-white font-medium text-[14px] hover:bg-ink-soft transition-all">
          Vis meg leads <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  )
}

function ICPSection({ label, items }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(i => (
          <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-canvas-warm border border-bdr text-txt-secondary">{i}</span>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div className="p-4 rounded-lg bg-canvas-soft border border-bdr">
      <div className="text-[10px] uppercase tracking-[0.14em] font-semibold text-txt-tertiary mb-1">{label}</div>
      <div className="font-display text-[24px] font-medium text-ink leading-none">{value}</div>
      <div className="text-[11px] text-txt-tertiary mt-0.5">{unit}</div>
    </div>
  )
}

/* ================= Step 5 — First leads ================= */
function StepLeads({ icp, matches, onComplete }) {
  if (!icp) return null
  return (
    <div className="animate-in">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-heat-hot mb-3">Ferdig · 5 av 5</div>
      <h1 className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        Her er dine <em className="italic text-heat-hot">10 varmeste leads.</em>
      </h1>
      <p className="mt-4 text-[15px] text-txt-secondary font-light max-w-[540px]">
        Alle matcher din ICP og har aktive kjøpssignaler. Signe har allerede klare første-meldinger.
      </p>

      {matches.length === 0 ? (
        <div className="mt-8 p-10 text-center">
          <div className="inline-flex items-center gap-2 text-txt-tertiary">
            <Sparkles size={14} className="text-heat-hot animate-pulse" />
            Matcher mot {icp.marketSize.toLocaleString('nb-NO')} selskap…
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-2.5">
          {matches.map((m, i) => (
            <div key={m.id} className="animate-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white border border-bdr hover:border-ink/30 hover:shadow-card transition-all">
                <span className="font-mono text-[11px] text-txt-tertiary w-6">{String(i + 1).padStart(2, '0')}</span>
                <div className="w-10 h-10 rounded-md bg-ink text-white flex items-center justify-center font-display text-[14px] font-medium flex-shrink-0">
                  {m.name.slice(0, 2).toUpperCase()}
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
                    {m.industry} · {m.city} · {m.employees} ansatte · {m.contact}
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
      )}

      {matches.length > 0 && (
        <div className="mt-10 p-6 rounded-xl bg-ink text-white flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-heat-hot font-semibold mb-1">Klar til å starte?</div>
            <div className="font-display text-[22px] font-medium">Signe setter opp første kampanje for deg</div>
            <div className="text-[12px] text-white/60 mt-1 font-light">
              Personaliserte e-poster · sekvenser · automatisk oppfølging
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={onComplete}
              className="px-4 py-2.5 rounded-md text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
              Gå til dashbord
            </button>
            <button onClick={onComplete}
              className="bg-heat-hot text-white px-5 py-2.5 rounded-md font-medium text-[13px] flex items-center gap-2 hover:opacity-90 transition-all">
              <Zap size={13}/> Start første kampanje
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ================= Mocks ================= */
function mockExtract(domain, company) {
  const d = domain.toLowerCase()
  if (d.includes('akerregnskap') || d.includes('regnskap')) return {
    oneLiner: `${company} — digitalt regnskapsbyrå for små og mellomstore bedrifter`,
    pitch: 'Fullstendig regnskapstjeneste med fast pris og personlig rådgiver. 12 ansatte, serverer 340+ kunder.',
    products: ['Fast-pris regnskap', 'Årsoppgjør & skatt', 'Lønnstjeneste', 'Økonomisk rådgivning'],
    customers: ['Nordic Startups', 'Cafe Nomade', 'Byggmester Berg', 'Vest Eiendom', 'Fjord Dental'],
    problem: 'Gründere bruker for mye tid på bilag — vi tar over og gir dem innsikt, ikke regnskap.',
  }
  if (d.includes('cloud') || d.includes('crm')) return {
    oneLiner: `${company} — skybaserte CRM-løsninger for norske selgere`,
    pitch: 'Norsk-utviklet CRM med Brreg-integrasjon, SMS og e-post i én flate. 24 ansatte i Oslo.',
    products: ['CRM Essentials', 'Proff-pakke', 'Enterprise API'],
    customers: ['Nordic Consult', 'Osloburo', 'Stavanger IT', 'Trondheim Marketing'],
    problem: 'Norske SMB-er bruker amerikanske CRM — vi bygger et som forstår Brreg, MVA og norsk kultur.',
  }
  return {
    oneLiner: `${company} — automatisert salgs- og leadgen-plattform`,
    pitch: 'Finner norske B2B-leads automatisk, skriver personaliserte e-poster via AI, og tracker hele pipelinen.',
    products: ['Lead-scraper', 'Signe (AI-assistent)', 'Pipeline & CRM', 'Integrasjoner'],
    customers: ['Aker Digital', 'Nordic Consult', 'Fjord Marketing', 'Osloburo'],
    problem: 'Selgere bruker 60% av tiden på å lete etter leads — vi finner dem automatisk.',
  }
}

function mockICP(extracted, goals) {
  const industries = extracted?.oneLiner?.toLowerCase().includes('regnskap')
    ? ['Oppstartsselskaper', 'Kafé & restaurant', 'Håndverk', 'Eiendom', 'Helse']
    : extracted?.oneLiner?.toLowerCase().includes('crm')
    ? ['Rådgivning', 'IT-byrå', 'Markedsføring', 'SaaS']
    : ['Regnskap & Revisjon', 'Rådgivning', 'IT-byrå', 'Markedsbyrå']

  return {
    persona: extracted?.oneLiner?.toLowerCase().includes('regnskap')
      ? 'Gründeren som kaster bilag'
      : 'Salgslederen som vokser',
    summary: `Ledere i ${industries[0].toLowerCase()} og ${industries[1].toLowerCase()}, 5–50 ansatte, vokser raskt og har allerede konkrete utfordringer som ${extracted?.problem?.toLowerCase() || 'leadgen'}.`,
    industries,
    size: '5–50 ansatte',
    geo: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger'],
    titles: ['Daglig leder', 'Salgssjef', 'COO'],
    signals: [
      { label: 'Ansetter i salg', weight: 18 },
      { label: 'Vekst +20% YoY', weight: 15 },
      { label: 'Ny salgssjef', weight: 14 },
      { label: 'LinkedIn-aktivitet om tema', weight: 12 },
      { label: 'Åpnet tidligere e-post', weight: 22 },
    ],
    marketSize: 4382,
    matchesNow: Math.floor(700 + Math.random() * 200),
    hotToday: Math.floor(40 + Math.random() * 40),
  }
}

function mockMatches(icp) {
  const rows = [
    ['Cloudway Solutions AS', 'SaaS',         'Oslo',      'Ingrid Bergseng', 92, 24],
    ['Nordic Consult AS',     'Rådgivning',   'Oslo',      'Kristin Mæland',  88, 38],
    ['Fjord Marketing',       'Markedsbyrå',  'Bergen',    'Anders Vik',      85, 18],
    ['Osloburo Digital',      'IT-byrå',      'Oslo',      'Pernille Sørli',  82, 14],
    ['Byggmester Solheim',    'Bygg',         'Trondheim', 'Tore Solheim',    78, 42],
    ['Aker Regnskap AS',      'Regnskap',     'Oslo',      'Pål Aker',        76, 12],
    ['Stavanger IT',          'IT-byrå',      'Stavanger', 'Jens Hauge',      74, 8],
    ['Grimstad Revisjon',     'Revisjon',     'Grimstad',  'Stein Berg',      72, 6],
    ['Nord Digital',          'Markedsbyrå',  'Tromsø',    'Maria Strand',    69, 22],
    ['Vestland Rådgivning',   'Rådgivning',   'Bergen',    'Lars Bø',         67, 30],
  ]
  return rows.map((r, i) => ({
    id: 'M-' + i,
    name: r[0], industry: r[1], city: r[2], contact: r[3], score: r[4], employees: r[5],
  }))
}
