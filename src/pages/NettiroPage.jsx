import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Globe,
  ShoppingCart,
  CalendarDays,
  Server,
  Link2,
  Wrench,
  MessageSquare,
  Palette,
  Code2,
  Rocket,
  Send,
} from 'lucide-react'

const SERVICES = [
  {
    icon: Globe,
    title: 'Nettsider',
    desc: 'Skreddersydde nettsider med moderne teknologi. Raske, responsive og optimalisert for søkemotorer.',
  },
  {
    icon: ShoppingCart,
    title: 'Nettbutikk & Betaling',
    desc: 'Betalingsløsninger med Vipps, Stripe med mer. Trygg og enkel handel for dine kunder.',
  },
  {
    icon: CalendarDays,
    title: 'Bookingsystemer',
    desc: 'Skreddersydde bookingløsninger som lar kundene dine bestille enkelt og effektivt.',
  },
  {
    icon: Server,
    title: 'Hosting',
    desc: 'Rask og sikker hosting med høy oppetid. Vi sørger for at nettsiden din alltid er tilgjengelig.',
  },
  {
    icon: Link2,
    title: 'Domene',
    desc: 'Hjelp med kjøp og oppsett av domene. Vi finner det perfekte domenenavnet for din bedrift.',
  },
  {
    icon: Wrench,
    title: 'Vedlikehold',
    desc: 'Løpende support, oppdateringer og vedlikehold. Vi passer på at alt fungerer som det skal.',
  },
]

const PROJECTS = [
  {
    title: 'Bjørke Juletre',
    desc: 'Nettside for juletreplantasje i Hardanger med bestillingssystem, bildegalleri og informasjon om selvhogst.',
    features: ['Responsivt design', 'Bestillingsskjema', 'Bildegalleri', 'SEO-optimalisert'],
    stack: ['Next.js', 'Tailwind CSS', 'Vercel'],
  },
  {
    title: 'Hyttebooking',
    desc: 'Fullverdig bookingsystem for fjellhytte med interaktiv kalender, brukeradministrasjon, varslingssystem og admin-dashboard.',
    features: ['Interaktiv kalender', 'Admin-dashboard', 'Varslingssystem', 'Brukeradministrasjon'],
    stack: ['Next.js', 'TypeScript', 'Turso DB', 'JWT Auth'],
  },
]

const PROCESS = [
  {
    num: '01',
    icon: MessageSquare,
    title: 'Samtale',
    desc: 'Vi starter med å forstå dine behov, mål og visjon. Sammen kartlegger vi hva løsningen må inneholde.',
  },
  {
    num: '02',
    icon: Palette,
    title: 'Design',
    desc: 'Vi lager et visuelt forslag tilpasset din merkevare. Du får se og kommentere før vi går videre.',
  },
  {
    num: '03',
    icon: Code2,
    title: 'Utvikling',
    desc: 'Vi bygger løsningen med moderne teknologi. Du holdes oppdatert underveis og kan gi tilbakemelding.',
  },
  {
    num: '04',
    icon: Rocket,
    title: 'Lansering',
    desc: 'Vi setter alt live, kobler opp domene og sørger for at alt fungerer perfekt før vi leverer.',
  },
]

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true)
        obs.disconnect()
      }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

export default function NettiroPage() {
  const navigate = useNavigate()
  const [heroRef, heroInView] = useInView(0)
  const [servRef, servInView] = useInView()
  const [projRef, projInView] = useInView()
  const [procRef, procInView] = useInView()
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Opens user's mail client — simple, no backend needed
    const subject = encodeURIComponent(`Henvendelse fra ${form.name || 'Nettiro-kontaktskjema'}`)
    const body = encodeURIComponent(
      `Navn: ${form.name}\nE-post: ${form.email}\nTelefon: ${form.phone}\nTjeneste: ${form.service}\n\n${form.message}`
    )
    window.location.href = `mailto:kontakt@nettiro.no?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900">
              <span className="font-display text-white text-sm font-semibold">L</span>
            </div>
            <span className="font-display text-[1.15rem] tracking-tight font-semibold">
              LeadFlow
            </span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => navigate('/')} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">LeadFlow</button>
            <button onClick={() => document.getElementById('tjenester')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Tjenester</button>
            <button onClick={() => document.getElementById('portefolje')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Portefølje</button>
            <button onClick={() => document.getElementById('prosess')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Prosess</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-lg text-[0.88rem] font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all">
              Få gratis tilbud
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[0.8rem] text-gray-500 font-medium">Tilgjengelig for nye prosjekter</span>
            </div>

            <h1 className="font-display text-[2.8rem] md:text-[3.8rem] font-bold leading-[1.1] tracking-tight mb-6 text-gray-900">
              Vi bygger nettsider<br />
              <span className="text-gray-400">som gir resultat</span>
            </h1>

            <p className="text-[1.1rem] text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Fra skreddersydde nettsider og nettbutikker til bookingsystemer og hosting. Vi håndterer alt slik at du kan fokusere på det du er best på.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button onClick={() => document.getElementById('portefolje')?.scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-[0.95rem] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-sm">
                Se våre prosjekter
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3.5 rounded-lg text-[0.95rem] font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                Kontakt oss
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className={`mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto transition-all duration-700 delay-200 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { value: '50+', label: 'Ferdigstilte prosjekter' },
              { value: '100%', label: 'Fornøyde kunder' },
              { value: '24/7', label: 'Hosting & support' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-[2.2rem] md:text-[2.6rem] font-bold text-gray-900 tracking-tight">{m.value}</div>
                <div className="text-[0.82rem] text-gray-500 mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="tjenester" ref={servRef} className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-16 transition-all duration-600 ${servInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Våre tjenester</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Alt du trenger for å lykkes på nett — ett sted.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i}
                  className={`p-6 rounded-xl bg-white border border-gray-100 transition-all duration-500 hover:shadow-md hover:border-gray-200 ${
                    servInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-display text-[1.05rem] font-semibold mb-2">{s.title}</h3>
                  <p className="text-[0.88rem] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portefolje" ref={projRef} className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-16 transition-all duration-600 ${projInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Utvalgte prosjekter</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Et lite utvalg av hva vi har bygget.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PROJECTS.map((p, i) => (
              <div key={i}
                className={`p-8 rounded-xl border border-gray-100 bg-white hover:shadow-lg hover:border-gray-200 transition-all duration-500 ${
                  projInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <h3 className="font-display text-[1.35rem] font-bold tracking-tight mb-2">{p.title}</h3>
                <p className="text-[0.92rem] text-gray-500 leading-relaxed mb-6">{p.desc}</p>

                <div className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-[0.85rem] text-gray-700">
                      <Check size={15} className="mt-0.5 flex-shrink-0 text-gray-900" />
                      {f}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-100">
                  {p.stack.map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-[0.72rem] font-medium text-gray-500">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="prosess" ref={procRef} className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-16 transition-all duration-600 ${procInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Slik jobber vi</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Fire trinn fra idé til ferdig lansert løsning.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {PROCESS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i}
                  className={`relative p-6 rounded-xl bg-white border border-gray-100 transition-all duration-500 ${
                    procInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="text-[0.7rem] font-semibold text-gray-300 tracking-widest mb-3">{step.num}</div>
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-display text-[1.05rem] font-semibold mb-2">{step.title}</h3>
                  <p className="text-[0.85rem] text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="kontakt" className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">
                Klar for å ta bedriften din til neste nivå?
              </h2>
              <p className="text-gray-500 text-[1.05rem] leading-relaxed mb-8">
                Vi elsker nye prosjekter! Send oss en melding, så tar vi en uforpliktende prat om hvordan vi kan hjelpe deg å vokse på nett.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[0.82rem] text-gray-600 font-medium">Svar innen 24 timer</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-7 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4">
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <Check size={22} className="text-green-600" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Takk for henvendelsen!</h3>
                  <p className="text-[0.9rem] text-gray-500">
                    Vi åpnet e-postklienten din. Send meldingen, så svarer vi innen 24 timer.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">Navn</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">E-post</label>
                      <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">Telefon</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">Tjeneste</label>
                    <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all bg-white">
                      <option value="">Velg tjeneste...</option>
                      {SERVICES.map(s => <option key={s.title} value={s.title}>{s.title}</option>)}
                      <option value="Annet">Annet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">Melding</label>
                    <textarea rows={4} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all resize-none" />
                  </div>
                  <button type="submit"
                    className="group w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[0.9rem] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all">
                    Send melding
                    <Send size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gray-900">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="font-display text-[1.8rem] md:text-[2.2rem] font-bold text-white mb-4">
            Trenger du en ny nettside?
          </h2>
          <p className="text-gray-400 text-[1rem] mb-8 max-w-lg mx-auto">
            Ta en uforpliktende prat. Vi gir deg et ærlig estimat — helt gratis.
          </p>
          <button onClick={() => document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-[0.95rem] font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all shadow-sm">
            Få gratis tilbud
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between flex-wrap gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-900">
              <span className="font-display text-white text-[0.55rem] font-semibold">L</span>
            </div>
            <span className="font-display text-[0.85rem] text-gray-400 font-medium">LeadFlow</span>
          </button>
          <p className="text-[0.78rem] text-gray-300">
            &copy; {new Date().getFullYear()} Nettiro. Alle rettigheter reservert. Laget med moderne teknologi i Norge.
          </p>
        </div>
      </footer>
    </div>
  )
}
