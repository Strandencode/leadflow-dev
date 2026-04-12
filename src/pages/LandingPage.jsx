import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Target, Mail, Kanban, BarChart3, Trophy, ArrowRight, Check, Shield, ChevronRight, Building2, Globe, Lock, Users, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Search, title: 'Prospektering', desc: 'Tilgang til hele Brønnøysundregistrene. Filtrer på bransje, geografi, selskapsstørrelse og omsetning.' },
  { icon: Zap, title: 'Enrichment', desc: 'Automatisk kontaktinfo, regnskapsdata og nøkkelpersoner — klar til bruk på sekunder.' },
  { icon: Mail, title: 'E-postmaler', desc: 'Ferdigskrevne bransjetilpassede maler med flettefelt. Generer og send direkte.' },
  { icon: Kanban, title: 'Pipeline', desc: 'Visuell Kanban-tavle fra første kontakt til lukket avtale. Dra og slipp.' },
  { icon: BarChart3, title: 'Analytics', desc: 'Konverteringsrater, kontaktrate og aktivitetsmetrikker — oppdatert i sanntid.' },
  { icon: Users, title: 'Workspace', desc: 'Inviter teamet, del lister og pipeline. Samarbeid med felles oversikt.' },
]

const PLANS = [
  { id: 'professional', name: 'Professional', price: '199', period: '/mnd', features: ['200 enrichments/mnd', 'Alle søkeresultater', '10 lagrede lister', 'Ubegrenset pipeline', 'E-post + CSV-eksport', 'Analytics dashboard'], popular: true, cta: 'Prøv gratis i 14 dager' },
  { id: 'business', name: 'Business', price: '499', period: '/mnd', features: ['Ubegrenset enrichment', 'Ubegrenset lister', 'Workspace — opptil 5 brukere', 'Delte lister og pipeline', 'Avansert analytics', 'Kundenotater + kontrakter'], cta: 'Prøv gratis i 14 dager' },
  { id: 'enterprise', name: 'Enterprise', price: '4 999', period: '/mnd', features: ['Alt i Business', 'Ubegrenset brukere', 'API-tilgang', 'SSO & SAML', 'Dedikert onboarding', 'Prioritert support'], cta: 'Kontakt oss' },
]

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

export default function LandingPage() {
  const navigate = useNavigate()
  const [heroRef, heroInView] = useInView(0)
  const [featRef, featInView] = useInView()
  const [priceRef, priceInView] = useInView()
  const [trustRef, trustInView] = useInView()

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-900">
              <span className="font-display text-white text-sm font-semibold">L</span>
            </div>
            <span className="font-display text-[1.15rem] tracking-tight font-semibold">
              LeadFlow
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Funksjoner</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">Priser</button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors font-medium">
              Logg inn
            </button>
            <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-lg text-[0.88rem] font-medium text-white bg-gray-900 hover:bg-gray-800 transition-all">
              Kom i gang
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[0.8rem] text-gray-500 font-medium">Brukt av 120+ norske bedrifter</span>
            </div>

            <h1 className="font-display text-[2.8rem] md:text-[3.8rem] font-bold leading-[1.1] tracking-tight mb-6 text-gray-900">
              Finn dine neste kunder<br />
              <span className="text-gray-400">direkte fra Brønnøysund</span>
            </h1>

            <p className="text-[1.1rem] text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Søk i hele Brønnøysundregistrene, finn kontaktinfo automatisk, og følg opp med pipeline og e-postmaler. Alt du trenger for B2B-salg i Norge.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2.5 px-7 py-3.5 rounded-lg text-[0.95rem] font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-sm">
                Prøv gratis i 14 dager
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3.5 rounded-lg text-[0.95rem] font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                Les mer
              </button>
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
                  <div className="px-3 py-1 rounded-md bg-gray-100 text-[0.72rem] text-gray-400 font-mono">app.leadflow.no</div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Leads funnet', value: '1,847', sub: 'denne måneden' },
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
                  {['Ny', 'Kontakt', 'Møte', 'Tilbud', 'Forhandling', 'Vunnet'].map((stage, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-center">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wider mb-1">{stage}</div>
                      <div className="font-display text-sm font-bold text-gray-700">{[12, 8, 5, 3, 2, 4][i]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section ref={trustRef} className="py-12 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`flex items-center justify-center gap-10 md:gap-14 flex-wrap transition-all duration-600 ${trustInView ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { icon: Shield, text: 'GDPR-kompatibel' },
              { icon: Lock, text: 'Kryptert data' },
              { icon: Building2, text: 'Norsk selskap' },
              { icon: Globe, text: '847 000+ foretak' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-2">
                  <Icon size={16} className="text-gray-300" />
                  <span className="text-[0.82rem] text-gray-400 font-medium">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Slik fungerer det</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Tre steg fra søk til kunde.</p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Søk', desc: 'Velg bransje, geografi og størrelse. Vi henter alle treff fra Brønnøysundregistrene.' },
              { num: '2', title: 'Kontakt', desc: 'Automatisk enrichment gir deg e-post, telefon og kontaktperson. Send e-post med ett klikk.' },
              { num: '3', title: 'Lukk', desc: 'Følg opp i pipeline, legg til notater og marker kunden som vunnet.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gray-900 text-white font-display text-lg font-bold flex items-center justify-center mx-auto mb-5">
                  {step.num}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-[0.9rem] text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featRef} className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-16 transition-all duration-600 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Alt du trenger for B2B-salg</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Én plattform, fra prospektering til lukket avtale.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className={`p-6 rounded-xl bg-white border border-gray-100 transition-all duration-500 hover:shadow-md hover:border-gray-200 ${
                    featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="font-display text-[1.05rem] font-semibold mb-2">{f.title}</h3>
                  <p className="text-[0.88rem] text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={priceRef} className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`text-center mb-16 transition-all duration-600 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold tracking-tight mb-4">Enkel og transparent prising</h2>
            <p className="text-gray-500 text-[1.05rem] max-w-lg mx-auto">Prøv gratis i 14 dager. Ingen kredittkort kreves.</p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <div key={plan.id}
                className={`relative p-7 rounded-xl border transition-all duration-500 ${
                  plan.popular ? 'border-gray-900 bg-white shadow-lg ring-1 ring-gray-900' : 'border-gray-200 bg-white'
                } ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[0.7rem] font-semibold text-white bg-gray-900">
                    Mest populær
                  </div>
                )}

                <div className="text-[0.78rem] text-gray-400 font-semibold uppercase tracking-wider mb-3">{plan.name}</div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-[2rem] font-bold">{plan.price}</span>
                    <span className="text-[0.88rem] text-gray-400">kr{plan.period}</span>
                  </div>
                  {plan.id !== 'enterprise' && (
                    <div className="text-[0.78rem] text-green-600 font-medium mt-1">14 dager gratis</div>
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
                    plan.popular
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-[0.82rem] text-gray-400 mt-8">
            14 dagers gratis prøveperiode. Ingen kredittkort kreves. Kanseller når som helst.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 bg-gray-900">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <h2 className="font-display text-[2rem] md:text-[2.5rem] font-bold text-white mb-4">
            Klar til å finne dine neste kunder?
          </h2>
          <p className="text-gray-400 text-[1.05rem] mb-10 max-w-lg mx-auto">
            Opprett konto på under 30 sekunder. Ingen kredittkort, ingen bindingstid.
          </p>
          <button onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-lg text-[0.95rem] font-semibold text-gray-900 bg-white hover:bg-gray-100 transition-all shadow-sm">
            Start gratis prøveperiode
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-900">
              <span className="font-display text-white text-[0.55rem] font-semibold">L</span>
            </div>
            <span className="font-display text-[0.85rem] text-gray-400 font-medium">LeadFlow</span>
          </div>
          <p className="text-[0.78rem] text-gray-300">
            &copy; {new Date().getFullYear()} LeadFlow AS. Oslo, Norge.
          </p>
        </div>
      </footer>
    </div>
  )
}
