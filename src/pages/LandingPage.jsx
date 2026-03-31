import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Target, Mail, Kanban, BarChart3, Trophy, ArrowRight, Check, Shield, ChevronRight, TrendingUp, Building2, Globe, Lock } from 'lucide-react'

const FEATURES = [
  { icon: Search, title: 'Prospektering', desc: 'Sok i hele Bronnoysundregistrene. Filtrer pa bransje, geografi, storrelse og omsetning.', tag: 'DATA' },
  { icon: Target, title: 'ICP-analyse', desc: 'Definer din ideelle kundeprofil og motta automatisk kvalifiserte leads.', tag: 'AI' },
  { icon: Mail, title: 'Outreach', desc: 'Generer tilpassede e-postmaler med intelligent flettefelt-teknologi.', tag: 'AUTOMATION' },
  { icon: Kanban, title: 'Pipeline CRM', desc: 'Visuell pipeline-styring fra forste kontakt til lukket avtale.', tag: 'CRM' },
  { icon: BarChart3, title: 'Analytics', desc: 'Konverteringsrater, aktivitetsmetrikker og portefoljeanalyse i sanntid.', tag: 'INSIGHTS' },
  { icon: Trophy, title: 'Kundeportefolje', desc: 'Komplett oversikt over vunnede kunder med kontrakter og historikk.', tag: 'MANAGEMENT' },
]

const STATS = [
  { value: '847K', label: 'Registrerte foretak' },
  { value: '99.9%', label: 'Oppetid' },
  { value: '2.4s', label: 'Gj.sn. responstid' },
  { value: 'SOC2', label: 'Sertifisert' },
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: '0', period: '', features: ['20 oppslag/mnd', 'Grunnleggende sok', 'ICP-profil', 'E-postmaler'], cta: 'Kom i gang' },
  { id: 'professional', name: 'Professional', price: '490', period: '/mnd', features: ['1 000 oppslag/mnd', 'Avansert filtrering', 'AI e-postgenerering', 'Pipeline CRM', 'Analytics dashboard'], popular: true, cta: 'Start prov' },
  { id: 'enterprise', name: 'Enterprise', price: 'Tilpasset', period: '', features: ['Ubegrenset oppslag', 'Dedikert kundeansvarlig', 'API-tilgang', 'SSO & SAML', 'Custom integrasjoner'], cta: 'Kontakt oss' },
]

const CLIENTS = ['DNB', 'Storebrand', 'SpareBank 1', 'Nordic Semiconductor', 'Mowi', 'Equinor', 'Telenor', 'Vipps']

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
  const [statsRef, statsInView] = useInView()
  const [priceRef, priceInView] = useInView()

  return (
    <div className="min-h-screen bg-ink text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center border border-gold/30"
              style={{ background: 'linear-gradient(135deg, rgba(0,81,168,0.15) 0%, rgba(0,81,168,0.05) 100%)' }}>
              <span className="font-display text-gold text-sm font-semibold">L</span>
            </div>
            <span className="font-display text-[1.15rem] tracking-wide">
              Lead<span className="text-gold">Flow</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.82rem] text-white/40 hover:text-white/80 transition-colors tracking-wide uppercase">Produkt</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-[0.82rem] text-white/40 hover:text-white/80 transition-colors tracking-wide uppercase">Priser</button>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-[0.82rem] text-white/50 hover:text-white transition-colors font-medium tracking-wide">
              Logg inn
            </button>
            <button onClick={() => navigate('/login')} className="px-5 py-2 rounded text-[0.82rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all tracking-wide">
              Opprett konto
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 40%, rgba(0,81,168,0.04) 0%, transparent 100%)' }} />

        {/* Fine grid pattern */}
        <div className="absolute inset-0 hero-grid opacity-50" />

        <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
          <div className={`transition-all duration-1000 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] mb-10">
              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="text-[0.75rem] text-white/40 tracking-wider uppercase font-medium">Norges ledende B2B-plattform</span>
            </div>

            <h1 className="font-display text-[3.2rem] md:text-[4.5rem] font-normal leading-[1.08] tracking-tight mb-8">
              Intelligent<br />
              <span className="gradient-text italic">prospektering</span>
              <br />for profesjonelle
            </h1>

            <p className="text-[1.05rem] text-white/35 max-w-xl mx-auto mb-12 leading-relaxed font-light">
              Komplett tilgang til Bronnoysundregistrene med AI-drevet enrichment, pipeline-styring og outreach-automatisering.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2.5 px-8 py-3.5 rounded text-[0.88rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all"
                style={{ letterSpacing: '0.03em' }}>
                Start gratis
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 rounded text-[0.88rem] font-medium border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] transition-all"
                style={{ letterSpacing: '0.03em' }}>
                Se oversikt
              </button>
            </div>
          </div>

          {/* Mock terminal/dashboard preview */}
          <div className={`mt-20 transition-all duration-1000 delay-300 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative mx-auto max-w-4xl rounded-lg overflow-hidden border border-white/[0.06]"
              style={{ background: '#0E0E14' }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded bg-white/[0.03] text-[0.7rem] text-white/20 font-mono">app.leadflow.no/dashboard</div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Pipeline-verdi', value: '24.8M', change: '+12.4%' },
                    { label: 'Aktive leads', value: '1,847', change: '+89' },
                    { label: 'Konverteringsrate', value: '23.4%', change: '+2.1pp' },
                    { label: 'Svar pa outreach', value: '34.2%', change: '+5.8pp' },
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded border border-white/[0.04] bg-white/[0.015]">
                      <div className="text-[0.65rem] text-white/25 uppercase tracking-wider mb-1 font-medium">{m.label}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xl font-medium text-white/80">{m.value}</span>
                        <span className="text-[0.65rem] text-emerald-400/60 font-mono">{m.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 h-28 rounded border border-white/[0.04] bg-white/[0.015] p-4">
                    <div className="text-[0.65rem] text-white/25 uppercase tracking-wider mb-3 font-medium">Pipeline fordeling</div>
                    <div className="flex items-end gap-1 h-14">
                      {[40, 65, 45, 80, 55, 70, 35, 60, 75, 50, 85, 42].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 10 ? 'rgba(0,81,168,0.5)' : 'rgba(0,81,168,0.15)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="w-48 h-28 rounded border border-white/[0.04] bg-white/[0.015] p-4">
                    <div className="text-[0.65rem] text-white/25 uppercase tracking-wider mb-3 font-medium">Topp segmenter</div>
                    <div className="space-y-2">
                      {[{ name: 'IT & Software', pct: 34 }, { name: 'Consulting', pct: 28 }, { name: 'Finance', pct: 19 }].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.pct * 2.5}%`, background: 'rgba(0,81,168,0.4)' }} />
                          </div>
                          <span className="text-[0.6rem] text-white/25 font-mono w-8 text-right">{s.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Client ticker */}
      <section className="py-10 border-y border-white/[0.04] overflow-hidden">
        <div className="flex items-center gap-12 whitespace-nowrap ticker-track">
          {[...CLIENTS, ...CLIENTS].map((c, i) => (
            <span key={i} className="text-[0.78rem] text-white/15 font-medium tracking-[0.15em] uppercase">{c}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 relative">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-4 gap-12">
            {STATS.map((s, i) => (
              <div key={i} className={`text-center transition-all duration-600 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="font-mono text-[2rem] font-medium text-white/80 mb-1">{s.value}</div>
                <div className="text-[0.78rem] text-white/25 tracking-wider uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featRef} className="py-28 relative">
        <div className="max-w-6xl mx-auto px-8">
          <div className={`mb-20 transition-all duration-600 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-[0.72rem] text-gold/60 uppercase tracking-[0.2em] font-medium mb-4">Plattformen</div>
            <h2 className="font-display text-[2.5rem] font-normal mb-4">
              Bygget for <span className="italic gradient-text">presisjon</span>
            </h2>
            <p className="text-[1rem] text-white/30 max-w-lg leading-relaxed font-light">
              Hvert verktoy er designet for a gi deg et overtak i markedet.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px bg-white/[0.04] rounded-lg overflow-hidden">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className={`p-8 transition-all duration-600 hover:bg-white/[0.03] ${
                    featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms`, background: '#0D0D13' }}>
                  <div className="flex items-center gap-3 mb-5">
                    <Icon size={18} className="text-gold/60" />
                    <span className="text-[0.6rem] text-gold/40 tracking-[0.2em] uppercase font-medium border border-gold/10 px-2 py-0.5 rounded">{f.tag}</span>
                  </div>
                  <h3 className="font-display text-[1.15rem] mb-3 text-white/85">{f.title}</h3>
                  <p className="text-[0.85rem] text-white/30 leading-relaxed font-light">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust / Security bar */}
      <section className="py-16 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex items-center justify-center gap-12">
            {[
              { icon: Shield, text: 'GDPR-kompatibel' },
              { icon: Lock, text: 'Ende-til-ende kryptert' },
              { icon: Building2, text: 'Norsk selskap' },
              { icon: Globe, text: '847K+ foretak indeksert' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <Icon size={15} className="text-white/15" />
                  <span className="text-[0.75rem] text-white/25 tracking-wider uppercase font-medium">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" ref={priceRef} className="py-28 relative">
        <div className="max-w-5xl mx-auto px-8">
          <div className={`mb-16 transition-all duration-600 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="text-[0.72rem] text-gold/60 uppercase tracking-[0.2em] font-medium mb-4">Priser</div>
            <h2 className="font-display text-[2.5rem] font-normal mb-4">
              Transparent <span className="italic gradient-text">prising</span>
            </h2>
            <p className="text-[1rem] text-white/30 max-w-lg leading-relaxed font-light">
              Start gratis. Skaler nar forretningen vokser.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={plan.id}
                className={`relative p-8 rounded-lg border transition-all duration-600 ${
                  plan.popular ? 'border-gold/20 bg-gold/[0.03]' : 'border-white/[0.06] bg-white/[0.015]'
                } ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded text-[0.65rem] font-medium text-ink bg-gold tracking-wider uppercase">
                    Anbefalt
                  </div>
                )}

                <div className="text-[0.72rem] uppercase tracking-[0.15em] text-white/25 font-medium mb-4">{plan.name}</div>

                <div className="mb-8">
                  {plan.price === 'Tilpasset' ? (
                    <div className="font-display text-[2rem] text-white/80">Tilpasset</div>
                  ) : plan.price === '0' ? (
                    <div className="font-display text-[2rem] text-white/80">Gratis</div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-[2rem] text-white/80">{plan.price}</span>
                      <span className="text-[0.85rem] text-white/25">kr{plan.period}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-[0.85rem] text-white/40">
                      <Check size={14} className={plan.popular ? 'text-gold/60' : 'text-white/20'} />
                      {f}
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded text-[0.82rem] font-medium transition-all tracking-wide ${
                    plan.popular
                      ? 'bg-gold text-ink hover:bg-gold-light'
                      : 'border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15]'
                  }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 relative">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <div className="p-16 rounded-lg border border-white/[0.04] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,81,168,0.03) 0%, rgba(10,10,15,0.5) 100%)' }}>
            <div className="text-[0.72rem] text-gold/50 uppercase tracking-[0.2em] font-medium mb-6">Klar til a starte?</div>
            <h2 className="font-display text-[2.2rem] font-normal mb-4 text-white/90">
              Opprett konto pa<br /><span className="italic gradient-text">under 30 sekunder</span>
            </h2>
            <p className="text-white/30 text-[0.95rem] mb-10 font-light">
              Ingen kredittkort. Ingen bindingstid. Full tilgang til grunnleggende funksjoner.
            </p>
            <button onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded text-[0.88rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all"
              style={{ letterSpacing: '0.03em' }}>
              Opprett konto
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded flex items-center justify-center border border-gold/20"
              style={{ background: 'rgba(0,81,168,0.08)' }}>
              <span className="font-display text-gold text-[0.5rem] font-semibold">L</span>
            </div>
            <span className="font-display text-[0.82rem] text-white/25">LeadFlow</span>
          </div>
          <p className="text-[0.72rem] text-white/15 tracking-wider">
            &copy; {new Date().getFullYear()} LeadFlow AS. Oslo, Norge.
          </p>
        </div>
      </footer>
    </div>
  )
}
