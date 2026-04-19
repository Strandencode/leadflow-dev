import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Target, Mail, Kanban, BarChart3, Trophy, ArrowRight, Check,
  Shield, ChevronRight, Building2, Globe, Lock, Users, Zap, Sparkles,
  MessageCircle, TrendingUp, Phone, FileText, Clock, MapPin, Briefcase
} from 'lucide-react'

/* ---------------- Data ---------------- */

const HERO_WORDS = ['bookes selv.', 'fylles automatisk.', 'lukker seg raskere.']
const HERO_WORD_INTERVAL = 3800

const DATA_SOURCES = [
  ['Brreg', 'Firmografi'],
  ['Proff', 'Regnskap'],
  ['Enin', 'Signaler'],
  ['LinkedIn', 'Personer'],
  ['Skatt', 'Status'],
  ['Doffin', 'Anbud'],
  ['DIBK', 'Godkj.'],
  ['NAV', 'Ansatte'],
  ['+ 12 til', 'Kilder'],
]

const CHAPTERS = [
  {
    num: 'I',
    kicker: 'Datagrunnlag',
    titleA: 'Hele Norges næringsliv ',
    titleEm: 'på ett sted.',
    lede: 'Vi kobler deg på Brønnøysundregistrene, Proff, Enin, Skatteetaten og LinkedIn — pluss 15+ andre kilder. Første dagen har du et komplett bilde av det norske markedet.',
    bullets: [
      'Alle 847 000+ norske AS-er, alltid oppdatert',
      'Regnskapstall, bransjekoder og eierstruktur',
      'Kontaktinfo verifisert mot Reservasjonsregisteret',
      'Sanntids vekstsignaler fra 15+ norske kilder',
    ],
    visual: 'sources',
    link: 'Se alle datakilder',
  },
  {
    num: 'II',
    kicker: 'Kontakt',
    titleA: 'Fra kaldt navn til ',
    titleEm: 'varm samtale.',
    lede: 'Signe skriver personlige åpnings-e-poster, sporer hvem som åpner, og minner deg om riktig oppfølging. Når du tar telefonen, vet kunden allerede hvem du er.',
    bullets: [
      'AI-skrevne e-poster med flettefelt på sekunder',
      'Åpnings- og klikk-sporing per mottaker',
      'Bransjetilpassede maler bygget inn',
      'Automatisk oppfølging når ingen svarer',
    ],
    visual: 'outreach',
    link: 'Se hvordan Signe jobber',
  },
  {
    num: 'III',
    kicker: 'Pipeline',
    titleA: 'Avtaler som ',
    titleEm: 'lukker seg selv.',
    lede: 'Én Kanban-tavle fra første lead til signert kontrakt. Dra og slipp mellom stadier, legg til notater, og se hvor hver kunde er — uten å bytte verktøy.',
    bullets: [
      'Kanban med seks stadier: fra ny lead til vunnet',
      'Notater og aktivitetslogg per kontakt',
      'Automatisk status-oppdatering ved e-post-svar',
      'Analytics: konverteringsrater og vinne-rate i sanntid',
    ],
    visual: 'pipeline',
    link: 'Utforsk pipelinen',
  },
]

const INDUSTRIES = [
  {
    index: '01 · Håndverk & entreprenør',
    img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop',
    alt: 'Håndverker på byggeplass',
    caption: 'Rørleggerselskap · 6 ansatte · 8.4 MNOK omsetning',
    titleA: 'Finn bygg som ',
    titleEm: 'venter på tilbud.',
    body: 'Norske håndverkere lever av anbud og gjenkjøp. LeadFlow varsler deg når det skjer noe verdt å ringe om — byggesaker, bedrifter som vokser, rammeavtaler som utløper.',
    features: [
      ['Byggesaker og rammetillatelser i ditt område', 'Kommune'],
      ['Bedrifter i vekst: flere ansatte, større lokaler', 'Signaler'],
      ['Offentlige byggherrer og leverandørregistre', 'Doffin'],
      ['Sentral godkjenning og mesterbrev verifisert', 'DIBK'],
    ],
    stats: [
      ['2.9×', 'flere kvalifiserte forespørsler'],
      ['8 t', 'mindre tid på prospektering'],
      ['97%', 'treff på riktig bransje'],
    ],
  },
  {
    index: '02 · Rekruttering & bemanning',
    img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop',
    alt: 'Intervju-situasjon',
    caption: 'Rekrutteringsbyrå · 12 ansatte · Oslo',
    titleA: 'Finn selskapene som ',
    titleEm: 'trenger folk nå.',
    body: 'Det sterkeste rekrutteringssignalet er vekst: bedrifter som utlyser stillinger, har økende omsetning, eller nettopp har hentet kapital. LeadFlow varsler deg samme dag behovet oppstår — ikke når det er offentlig.',
    features: [
      ['Aktive stillingsutlysninger i din region og bransje', 'Finn.no'],
      ['Selskaper med rask vekst i antall ansatte', 'Brreg + NAV'],
      ['Nylig kapitalinnhenting og emisjoner', 'Regnskap'],
      ['Nyansatt HR-leder eller CPO — ny avtalemulighet', 'LinkedIn'],
    ],
    stats: [
      ['3.4×', 'flere oppdrag booket per måned'],
      ['10 t', 'mindre tid på prospektering'],
      ['48%', 'raskere fra signal til første samtale'],
    ],
  },
  {
    index: '03 · IT & konsulent',
    img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop',
    alt: 'IT-konsulenter i møte',
    caption: 'IT-konsulent · 12 ansatte · 18 MNOK omsetning',
    titleA: 'Bedrifter som vokser ',
    titleEm: 'trenger system.',
    body: 'IT-salg handler om riktig tidspunkt. LeadFlow viser deg bedrifter som nettopp har ansatt CIO, oppskalert serverbudsjett eller lansert nytt produkt — før konkurrentene ser det.',
    features: [
      ['Nyansettelser innen tech og ledelse', 'LinkedIn'],
      ['Stillingsutlysninger og teknologi-skifter', 'Finn.no'],
      ['Selskaper med vekstsignaler > 30% YoY', 'Regnskap'],
      ['Integrasjoner: HubSpot, Pipedrive, SuperOffice', 'API'],
    ],
    stats: [
      ['4.1×', 'flere kvalifiserte leads'],
      ['184 k', 'snitt avtaleverdi'],
      ['31%', 'kortere salgssyklus'],
    ],
  },
]

const STORIES = [
  {
    company: 'Optima Produkter AS',
    num: '+340',
    sup: '%',
    label: 'flere møter booket på 3 måneder',
    quote: 'Vi brukte to dager i uken på Brønnøysund og LinkedIn. Nå gjør LeadFlow det på 15 minutter, og vi bruker resten av tiden på å faktisk snakke med folk.',
    ava: 'AH',
    avaCls: 'bg-blue-100 text-blue-700',
    name: 'Anita Hansen',
    role: 'Salgssjef · Optima Produkter AS · Oslo',
  },
  {
    company: 'Nordlys Grossist AS',
    num: '3.2',
    sup: '×',
    label: 'så mange nye forhandlere, halvert ring-tid',
    quote: 'Signe skriver bedre åpningsmailer enn jeg gjør — og hun jobber 24/7. Vi har doblet forhandlernettet på seks måneder.',
    ava: 'LH',
    avaCls: 'bg-emerald-100 text-emerald-700',
    name: 'Lars Haugen',
    role: 'Daglig leder · Nordlys Grossist AS · Bergen',
  },
  {
    company: 'NordIT Solutions',
    num: '42',
    sup: '%',
    label: 'kortere salgssyklus, signert på første møte',
    quote: 'Kontaktinfoen er alltid fersk. Vi møter opp med rett person, rett tema, rett tidspunkt. Det er ikke kaldt salg — det er forberedt salg.',
    ava: 'MB',
    avaCls: 'bg-amber-100 text-amber-700',
    name: 'Marie Berg',
    role: 'Gründer · NordIT Solutions · Trondheim',
  },
]

const PLANS = [
  { id: 'professional', name: 'Professional', price: 199, features: ['200 enrichments/mnd', 'Alle søkeresultater', '10 lagrede lister', 'Ubegrenset pipeline', 'E-post + CSV-eksport', 'Analytics dashboard'], popular: true, cta: 'Prøv gratis i 14 dager' },
  { id: 'business', name: 'Business', price: 499, features: ['Ubegrenset enrichment', 'Ubegrenset lister', 'Workspace — opptil 5 brukere', 'Delte lister og pipeline', 'Avansert analytics', 'Kundenotater + kontrakter'], cta: 'Prøv gratis i 14 dager' },
  { id: 'enterprise', name: 'Enterprise', price: null, features: ['Alt i Business', 'Ubegrenset brukere', 'API-tilgang', 'SSO & SAML', 'Dedikert onboarding', 'Prioritert support'], cta: 'Kontakt oss' },
]

const YEARLY_DISCOUNT = 0.2

/* ---------------- Hooks ---------------- */

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function useWordRotator(words, interval = HERO_WORD_INTERVAL) {
  const [idx, setIdx] = useState(0)
  const [exiting, setExiting] = useState(-1)
  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => {
        setExiting(i)
        setTimeout(() => setExiting(-1), 500)
        return (i + 1) % words.length
      })
    }, interval)
    return () => clearInterval(t)
  }, [words.length, interval])
  return [idx, exiting]
}

/* ---------------- Component ---------------- */

export default function LandingPage() {
  const navigate = useNavigate()
  const [heroRef, heroInView] = useInView(0)
  const [priceRef, priceInView] = useInView()
  const [storiesRef, storiesInView] = useInView()
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [wordIdx, exitingIdx] = useWordRotator(HERO_WORDS)

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* ============ NAV ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900">
              <span className="font-display text-white text-sm font-semibold">L</span>
            </div>
            <span className="font-display text-[1.15rem] tracking-tight font-semibold">LeadFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Produkt</button>
            <button onClick={() => document.getElementById('industries')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Bransjer</button>
            <button onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Kunder</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Priser</button>
            <button onClick={() => navigate('/nettiro')} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Nettsider</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors font-medium">
              Logg inn
            </button>
            <button onClick={() => navigate('/login')} className="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.88rem] font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all">
              Kom i gang
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section ref={heroRef} className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[0.8rem] text-gray-500 font-medium">Norsk B2B-plattform · 2026</span>
            </div>

            <h1 className="font-display text-[2.6rem] md:text-[4rem] font-bold leading-[1.05] tracking-tight mb-6 text-gray-900">
              Du tar samtalen.<br />
              <span className="text-gray-400">Vi sørger for at </span>
              <span className="relative inline-block align-bottom" style={{ minWidth: '280px' }}>
                {HERO_WORDS.map((w, i) => {
                  const state = i === wordIdx ? 'opacity-100 translate-y-0' : i === exitingIdx ? 'opacity-0 -translate-y-4' : 'opacity-0 translate-y-4'
                  return (
                    <span
                      key={w}
                      className={`absolute left-0 right-0 text-gray-900 transition-all duration-500 ${state}`}
                    >
                      {w}
                    </span>
                  )
                })}
                {/* Spacer so layout doesn't collapse */}
                <span className="invisible">{HERO_WORDS.reduce((a,b) => a.length > b.length ? a : b)}</span>
              </span>
            </h1>

            <p className="text-[1.1rem] text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              LeadFlow kobler deg på hele Norges næringsliv — fra første søk til signert kontrakt.
              Mens du gjør det du er god på, gjør vi resten.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-[0.95rem] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-sm">
                Prøv gratis i 14 dager
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3.5 rounded-lg text-[0.95rem] font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                Se hvordan det funker
              </button>
            </div>

            <div className="mt-8 text-[0.78rem] text-gray-400">
              Brukt av 120+ norske selgere innen håndverk, rekruttering, IT og media
            </div>
          </div>

          {/* Dashboard preview */}
          <div className={`mt-16 transition-all duration-700 delay-200 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative mx-auto max-w-3xl rounded-xl overflow-hidden border border-gray-200 shadow-2xl shadow-gray-200/50 bg-white">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                  <div className="w-3 h-3 rounded-full bg-gray-200" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-1 rounded-md bg-gray-100 text-[0.72rem] text-gray-400 font-mono">app.leadflow.no/pipeline</div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Leads funnet', value: '1 847', sub: 'denne måneden' },
                    { label: 'E-poster sendt', value: '342', sub: '+89 denne uken' },
                    { label: 'Kontaktrate', value: '34%', sub: '+5.8pp' },
                    { label: 'Kunder vunnet', value: '23', sub: '23.4% win-rate' },
                  ].map((m, i) => (
                    <div key={i} className="p-3.5 rounded-lg border border-gray-100 bg-gray-50/50">
                      <div className="text-[0.65rem] text-gray-400 uppercase tracking-wider mb-1 font-medium">{m.label}</div>
                      <div className="font-display text-xl font-bold text-gray-900">{m.value}</div>
                      <div className="text-[0.65rem] text-green-600 mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {['Ny', 'Kontaktet', 'Møte', 'Tilbud', 'Forhandling', 'Vunnet'].map((stage, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-1">{stage}</div>
                      <div className="font-display text-sm font-bold text-gray-700">{[12, 8, 5, 3, 2, 4][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Signe floating bubble */}
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute -bottom-6 left-4 md:left-8 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 max-w-sm">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={15} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-[0.78rem] font-semibold text-gray-900 flex items-center gap-1.5">
                    Signe <span className="text-[0.65rem] font-normal text-gray-400">· AI-assistent</span>
                  </div>
                  <div className="text-[0.75rem] text-gray-500 leading-snug">
                    <b>Byggmester Hansen</b> matcher 94% av dine beste kunder. Skal jeg sende en første e-post?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BAND ============ */}
      <section className="py-10 border-y border-gray-100 mt-8 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-center gap-x-10 gap-y-5 flex-wrap">
            {[
              { icon: MapPin, text: 'Data lagret i EU/EØS' },
              { icon: Shield, text: 'BankID-pålogging' },
              { icon: Lock, text: 'GDPR + Markedsføringsloven' },
              { icon: Globe, text: '847 000+ norske foretak' },
              { icon: Check, text: '99.8% oppetid' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-2">
                  <Icon size={15} className="text-gray-300" />
                  <span className="text-[0.82rem] text-gray-400 font-medium">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ============ CHAPTERS ============ */}
      <section id="how" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-8 space-y-24 md:space-y-32">
          {CHAPTERS.map((c, i) => (
            <Chapter key={c.num} chapter={c} reverse={i % 2 === 1} navigate={navigate} />
          ))}
        </div>
      </section>

      {/* ============ INTERLUDE — MEANWHILE SIGNE WORKS ============ */}
      <section className="relative py-24 md:py-32 bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/40" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-4xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6">
            <Clock size={13} className="text-gray-400" />
            <span className="text-[0.72rem] text-gray-400 font-medium tracking-wide uppercase">Døgnkontinuerlig</span>
          </div>
          <h2 className="font-display text-[2.2rem] md:text-[3rem] font-bold leading-[1.1] mb-6">
            Mens du sover,<br />
            <span className="text-gray-400">jobber </span>
            <span className="italic bg-gradient-to-br from-blue-400 to-emerald-400 bg-clip-text text-transparent">Signe.</span>
          </h2>
          <p className="text-gray-400 text-[1.05rem] max-w-xl mx-auto leading-relaxed mb-10">
            LeadFlow er alltid på. Signe overvåker markedet 24/7 — sjekker vekstsignaler,
            oppdaterer kontaktinfo, personaliserer sekvenser. Når du åpner laptopen mandag morgen,
            står pipelinen full.
          </p>
          <button onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-[0.95rem] font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all">
            Se hvordan Signe jobber
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* ============ INDUSTRIES ============ */}
      <section id="industries" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-start justify-between gap-8 flex-wrap mb-16">
            <div className="max-w-xl">
              <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">Bransjer</div>
              <h2 className="font-display text-[2rem] md:text-[2.6rem] font-bold tracking-tight leading-[1.1]">
                Bygget for bransjer <br />der <em className="text-gray-500 font-display">tiden</em> går til driften.
              </h2>
            </div>
            <p className="text-gray-500 text-[1.05rem] max-w-sm leading-relaxed mt-2">
              LeadFlow fungerer for alle B2B-bransjer, men vi har kalibrert datamodellen for de
              som trenger oss mest.
            </p>
          </div>

          <div className="space-y-24 md:space-y-32">
            {INDUSTRIES.map((ind, i) => (
              <IndustrySpread key={ind.index} industry={ind} reverse={i % 2 === 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ CUSTOMER STORIES ============ */}
      <section id="stories" ref={storiesRef} className="py-20 md:py-28 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-8">
          <div className={`mb-14 transition-all duration-700 ${storiesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">Kunder</div>
            <h2 className="font-display text-[2rem] md:text-[2.6rem] font-bold tracking-tight leading-[1.1] max-w-2xl">
              Resultater som <em className="text-gray-500 font-display">snakker for seg selv</em>.
            </h2>
          </div>

          <div className="space-y-8">
            {STORIES.map((s, i) => (
              <Story key={s.company} story={s} inView={storiesInView} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" ref={priceRef} className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-10 transition-all duration-600 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-3">Priser</div>
            <h2 className="font-display text-[2rem] md:text-[2.6rem] font-bold tracking-tight leading-[1.1] mb-4">Enkel og transparent prising.</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Prøv gratis i 14 dager. Ingen kredittkort kreves.</p>
          </div>

          <div className={`flex justify-center mb-12 transition-all duration-600 ${priceInView ? 'opacity-100' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 border border-gray-200">
              <button onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-full text-[0.85rem] font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                Månedlig
              </button>
              <button onClick={() => setBillingPeriod('yearly')}
                className={`px-5 py-2 rounded-full text-[0.85rem] font-medium transition-all flex items-center gap-2 ${billingPeriod === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                Årlig
                <span className="px-1.5 py-0.5 rounded-full text-[0.65rem] font-bold bg-green-100 text-green-700">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => {
              const isYearly = billingPeriod === 'yearly'
              const monthlyPrice = plan.price ? (isYearly ? Math.round(plan.price * (1 - YEARLY_DISCOUNT)) : plan.price) : null
              const yearlyTotal = plan.price ? Math.round(plan.price * (1 - YEARLY_DISCOUNT)) * 12 : null
              const yearlySavings = plan.price ? plan.price * 12 - yearlyTotal : 0
              return (
                <div key={plan.id}
                  className={`relative p-7 rounded-xl border transition-all duration-500 ${
                    plan.popular ? 'border-gray-900 bg-white shadow-lg ring-1 ring-gray-900' : 'border-gray-200 bg-white'
                  } ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[0.7rem] font-semibold text-white bg-gray-900">
                      Mest populær
                    </div>
                  )}
                  <div className="text-[0.78rem] text-gray-400 font-semibold uppercase tracking-wider mb-3">{plan.name}</div>
                  <div className="mb-6">
                    {!plan.price ? (
                      <div className="font-display text-[2rem] font-bold">Custom</div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-[2rem] font-bold">{monthlyPrice}</span>
                          <span className="text-[0.88rem] text-gray-400">kr/mnd</span>
                        </div>
                        {isYearly ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[0.72rem] text-gray-400">
                              <span className="line-through">{plan.price} kr/mnd</span> · faktureres {yearlyTotal} kr/år
                            </div>
                            <div className="text-[0.78rem] text-green-600 font-medium">
                              Spar {yearlySavings} kr/år · 14 dager gratis
                            </div>
                          </div>
                        ) : (
                          <div className="text-[0.78rem] text-green-600 font-medium mt-1">14 dager gratis</div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="space-y-3 mb-7">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2.5 text-[0.85rem] text-gray-600">
                        <Check size={15} className={`mt-0.5 flex-shrink-0 ${plan.popular ? 'text-gray-900' : 'text-gray-300'}`} />
                        {f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/login')}
                    className={`w-full py-3 rounded-lg text-[0.88rem] font-semibold transition-all ${
                      plan.popular ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}>
                    {plan.cta}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-center text-[0.82rem] text-gray-400 mt-8">
            {billingPeriod === 'yearly' ? 'Årsabonnement faktureres på forhånd. 14 dagers gratis prøveperiode. Ingen kredittkort.' : '14 dagers gratis prøveperiode. Ingen kredittkort. Kanseller når som helst.'}
          </p>
        </div>
      </section>

      {/* ============ FINAL THESIS / CTA ============ */}
      <section className="py-24 md:py-32 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-8">
            <span className="text-[0.72rem] text-gray-400 font-medium tracking-wide uppercase">Klar for å kjøre?</span>
          </div>
          <h2 className="font-display text-[2.4rem] md:text-[3.4rem] font-bold leading-[1.05] mb-6">
            Mindre leting.<br />
            <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-emerald-400">Mer salg.</em>
          </h2>
          <p className="text-gray-400 text-[1.05rem] mb-10 max-w-lg mx-auto leading-relaxed">
            Start gratis i dag. 14 dager, alle funksjoner, ingen kortopplysninger.
            Norsk support svarer på under én time i kontortiden.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/login')}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-lg text-[0.95rem] font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all">
              Prøv gratis i 14 dager
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate('/login')}
              className="px-7 py-4 rounded-lg text-[0.95rem] font-medium text-white border border-white/20 hover:bg-white/10 transition-all">
              Bestill demo
            </button>
          </div>
          <div className="mt-10 flex items-center justify-center gap-4 text-[0.8rem] text-gray-500 flex-wrap">
            <span>Norsk support</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>Data i Norge</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>GDPR</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>BankID</span>
          </div>
        </div>
      </section>

      {/* ============ NETTIRO CROSS-SELL ============ */}
      <section className="py-16 border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center justify-between gap-8 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-[280px]">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Globe size={18} className="text-gray-700" />
              </div>
              <div>
                <div className="text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider mb-1">Bonus</div>
                <h3 className="font-display text-[1.1rem] font-semibold mb-1 text-gray-900">Trenger du også en nettside?</h3>
                <p className="text-[0.9rem] text-gray-500 leading-relaxed">
                  Vi bygger skreddersydde nettsider, nettbutikker og bookingsystemer. Rask levering, full support.
                </p>
              </div>
            </div>
            <button onClick={() => navigate('/nettiro')}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.88rem] font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
              Les mer
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-16 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-gray-900">
                  <span className="font-display text-white text-[0.7rem] font-semibold">L</span>
                </div>
                <span className="font-display text-[1rem] font-semibold">LeadFlow</span>
              </div>
              <p className="text-[0.85rem] text-gray-500 leading-relaxed max-w-xs mb-4">
                Du tar samtalen. Vi finner kundene. Bygget i Norge, for norske B2B-selgere.
              </p>
              <div className="inline-flex rounded-md border border-gray-200 bg-white text-[0.75rem] overflow-hidden">
                <button className="px-2.5 py-1 bg-gray-900 text-white">NO</button>
                <button className="px-2.5 py-1 text-gray-400 hover:text-gray-900 transition-colors">EN</button>
              </div>
            </div>
            <FooterCol title="Produkt" items={['Prospektering', 'Datakilder', 'Signe · AI', 'Pipeline', 'Analytics', 'Integrasjoner']} />
            <FooterCol title="Bransjer" items={['Håndverk', 'Rekruttering', 'IT & konsulent', 'Media', 'Transport', 'Alle bransjer']} />
            <FooterCol title="Selskap" items={['Om oss', 'Kunder', 'Priser', 'Karriere', 'Kontakt', 'Nettsider']} />
          </div>

          <div className="pt-8 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-[0.78rem] text-gray-400">
            <div>
              LeadFlow AS · Org.nr 999&thinsp;888&thinsp;777 · Oslo, Norge
            </div>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-gray-700 transition-colors">Personvern</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Vilkår</a>
              <a href="#" className="hover:text-gray-700 transition-colors">Cookies</a>
              <span className="text-gray-300">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------------- Sub-components ---------------- */

function Chapter({ chapter, reverse, navigate }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div ref={ref} className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-display text-[3.5rem] font-bold text-gray-900 leading-none">{chapter.num}</span>
          <div className="flex flex-col">
            <span className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider">Kapittel {chapter.num}</span>
            <span className="text-[0.88rem] text-gray-700 font-medium">{chapter.kicker}</span>
          </div>
          <div className="flex-1 h-px bg-gray-200 ml-3" />
        </div>
        <h2 className="font-display text-[1.8rem] md:text-[2.4rem] font-bold leading-[1.15] tracking-tight mb-5">
          {chapter.titleA}<em className="text-gray-400 font-display">{chapter.titleEm}</em>
        </h2>
        <p className="text-gray-500 text-[1.02rem] leading-relaxed mb-6">{chapter.lede}</p>
        <ul className="space-y-3 mb-7">
          {chapter.bullets.map(b => (
            <li key={b} className="flex items-start gap-3 text-[0.92rem] text-gray-700">
              <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={11} strokeWidth={3} />
              </div>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => navigate('/login')} className="group inline-flex items-center gap-2 text-[0.88rem] font-semibold text-gray-900 hover:text-gray-600 transition-colors">
          {chapter.link}
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      <div>
        <ChapterVisual type={chapter.visual} />
      </div>
    </div>
  )
}

function ChapterVisual({ type }) {
  if (type === 'sources') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg shadow-gray-200/40">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[0.78rem] text-gray-600 font-medium">Datakilder</span>
          </div>
          <span className="text-[0.7rem] text-gray-400 font-mono">sanntid · 99.8%</span>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2.5">
            {DATA_SOURCES.map(([name, type]) => (
              <div key={name} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1.5" />
                <div className="text-[0.78rem] font-semibold text-gray-900 leading-none mb-0.5">{name}</div>
                <div className="text-[0.68rem] text-gray-400">{type}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[0.82rem] font-semibold">LeadFlow unified graph</div>
              <div className="text-[0.7rem] text-gray-400">Kobler 20+ kilder til én modell</div>
            </div>
            <div className="text-right">
              <div className="font-display text-[0.95rem] font-bold">847k</div>
              <div className="text-[0.65rem] text-gray-400">foretak</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'outreach') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg shadow-gray-200/40">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-[0.78rem] text-gray-700 font-semibold">Signe · skriver e-post</span>
          </div>
          <span className="text-[0.7rem] text-gray-400">dag 1 / 5</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { icon: Check, title: 'Signal registrert', sub: 'Byggmester Hansen · ny daglig leder', time: '2 t siden', done: true },
            { icon: Sparkles, title: 'Signe skriver åpnings-e-post', sub: 'Personalisert for Ole Hansen · 94% match', time: 'Nå', highlight: true },
            { icon: Mail, title: 'Sendt · tirsdag 09:14', sub: 'Optimal tid for bransjen', time: '+22 min' },
            { icon: MessageCircle, title: 'LinkedIn-melding', sub: 'Planlagt · torsdag 11:30', time: '+2 d' },
            { icon: Phone, title: 'Ring ved åpning', sub: 'Overføres til deg', time: 'Auto' },
          ].map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                step.highlight ? 'border-blue-200 bg-blue-50/50' : step.done ? 'border-gray-100 bg-gray-50/30' : 'border-gray-100'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.highlight ? 'bg-gradient-to-br from-blue-500 to-emerald-500 text-white' :
                  step.done ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon size={12} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.8rem] font-semibold text-gray-900 leading-none mb-0.5">{step.title}</div>
                  <div className="text-[0.7rem] text-gray-500">{step.sub}</div>
                </div>
                <div className="text-[0.68rem] text-gray-400 flex-shrink-0">{step.time}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (type === 'pipeline') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-lg shadow-gray-200/40">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <span className="text-[0.78rem] text-gray-700 font-semibold">Pipeline · uke 16</span>
          <span className="text-[0.7rem] text-gray-400">247 leads · 2.4 M kr</span>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { name: 'Nye', count: 42, color: 'bg-blue-500', items: [
                { t: 'Byggmester Hansen', m: 'Bergen · 94%' },
                { t: 'Fjell Transport', m: 'Trondheim · 88%' },
              ]},
              { name: 'I dialog', count: 18, color: 'bg-amber-500', items: [
                { t: 'Sørlandet Elektro', m: 'Venter svar' },
                { t: 'Hordaland Snekkeri', m: 'Møte avtalt' },
              ]},
              { name: 'Vunnet', count: 14, color: 'bg-emerald-500', items: [
                { t: 'Vest Snekker AS', m: '412 k' },
                { t: 'Ask Industri', m: '680 k' },
              ]},
            ].map(col => (
              <div key={col.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                    <span className="text-[0.72rem] font-semibold text-gray-700">{col.name}</span>
                  </div>
                  <span className="text-[0.65rem] text-gray-400 font-mono">{col.count}</span>
                </div>
                {col.items.map((it, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/40">
                    <div className="text-[0.72rem] font-semibold text-gray-900 leading-none mb-1 truncate">{it.t}</div>
                    <div className="text-[0.65rem] text-gray-500">{it.m}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}

function IndustrySpread({ industry, reverse }) {
  const [ref, inView] = useInView(0.1)
  return (
    <div ref={ref} className={`grid md:grid-cols-2 gap-10 md:gap-14 items-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${reverse ? 'md:[&>*:first-child]:order-2' : ''}`}>
      <div className="relative">
        <div className="absolute -top-3 left-4 z-10 px-3 py-1 rounded-full bg-white shadow-sm border border-gray-200 text-[0.7rem] font-semibold text-gray-600 tracking-wide">
          {industry.index}
        </div>
        <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-[4/5] relative">
          <img src={industry.img} alt={industry.alt} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent text-white">
            <div className="text-[0.75rem] font-medium">{industry.caption}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-[1.8rem] md:text-[2.3rem] font-bold leading-[1.1] tracking-tight mb-5">
          {industry.titleA}<em className="text-gray-400 font-display">{industry.titleEm}</em>
        </h3>
        <p className="text-gray-500 text-[1rem] leading-relaxed mb-6">{industry.body}</p>

        <ul className="space-y-2.5 mb-7">
          {industry.features.map(([lbl, src]) => (
            <li key={lbl} className="flex items-center justify-between py-2.5 border-b border-gray-100 gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <Check size={14} className="text-gray-900 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-[0.88rem] text-gray-800 font-medium">{lbl}</span>
              </div>
              <span className="text-[0.7rem] text-gray-400 font-mono uppercase tracking-wider flex-shrink-0">{src}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-3 gap-4 pt-2">
          {industry.stats.map(([num, lbl]) => (
            <div key={lbl}>
              <div className="font-display text-[1.6rem] font-bold text-gray-900 leading-none mb-1 tabular-nums">{num}</div>
              <div className="text-[0.72rem] text-gray-500 leading-tight">{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Story({ story, inView, delay }) {
  return (
    <article
      className={`bg-white rounded-2xl border border-gray-100 p-8 md:p-10 grid md:grid-cols-[minmax(0,1fr)_2fr] gap-8 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="md:border-r md:border-gray-100 md:pr-8">
        <div className="text-[0.72rem] font-semibold text-gray-400 uppercase tracking-wider mb-4">{story.company}</div>
        <div className="font-display text-[3.2rem] md:text-[4rem] font-bold text-gray-900 leading-none mb-2 tabular-nums">
          {story.num}<sup className="text-[1.8rem] md:text-[2rem] text-gray-400 font-bold align-top ml-1">{story.sup}</sup>
        </div>
        <div className="text-[0.88rem] text-gray-500 leading-snug max-w-[240px]">{story.label}</div>
      </div>
      <div>
        <p className="text-[1.1rem] md:text-[1.25rem] text-gray-800 leading-relaxed mb-6 font-light">
          <span className="text-gray-300 font-serif text-[2rem] leading-none mr-1">“</span>
          {story.quote}
          <span className="text-gray-300 font-serif text-[2rem] leading-none">”</span>
        </p>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[0.85rem] ${story.avaCls}`}>
            {story.ava}
          </div>
          <div>
            <div className="text-[0.9rem] font-semibold text-gray-900">{story.name}</div>
            <div className="text-[0.78rem] text-gray-500">{story.role}</div>
          </div>
        </div>
      </div>
    </article>
  )
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h4 className="text-[0.78rem] font-semibold text-gray-900 uppercase tracking-wider mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {items.map(i => (
          <li key={i}>
            <a href="#" className="text-[0.85rem] text-gray-500 hover:text-gray-900 transition-colors">{i}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
