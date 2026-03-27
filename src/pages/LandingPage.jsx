import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Target, Mail, Kanban, BarChart3, Trophy, ArrowRight, Check, Star, Zap, Crown, Rocket, ChevronRight } from 'lucide-react'

const FEATURES = [
  { icon: Search, title: 'Finn leads', desc: 'Sok i hele Bronnoysundregistrene. Filtrer pa bransje, kommune, storrelse og mer.', color: '#FF6B4A' },
  { icon: Target, title: 'ICP Builder', desc: 'Definer din ideelle kundeprofil og fa automatiske anbefalinger.', color: '#7C5CFC' },
  { icon: Mail, title: 'E-postmaler', desc: 'AI-genererte maler tilpasset hvert kundesegment med flettefelt.', color: '#2DD4BF' },
  { icon: Kanban, title: 'Pipeline', desc: 'Visuell kanban-board for a spore leads fra forste kontakt til closed won.', color: '#FF6B4A' },
  { icon: BarChart3, title: 'Analytics', desc: 'Se konverteringsrater, aktivitet og ytelse pa tvers av lister.', color: '#7C5CFC' },
  { icon: Trophy, title: 'Kunder', desc: 'Hold oversikt over vunnede kunder med kontrakter og notater.', color: '#2DD4BF' },
]

const STATS = [
  { value: '120+', label: 'Norske bedrifter' },
  { value: '50K+', label: 'Leads funnet' },
  { value: '12K+', label: 'E-poster sendt' },
  { value: '98%', label: 'Fornoydhetsrate' },
]

const PLANS = [
  { id: 'free', name: 'Gratis', price: '0', icon: Zap, features: ['20 e-poster/mnd', '20 telefonnumre/mnd', 'Ubegrenset sok', 'ICP-profil'], color: '#9E98B5' },
  { id: 'starter', name: 'Starter', price: '49', icon: Crown, features: ['1 000 e-poster/mnd', '1 000 telefonnumre/mnd', 'AI e-postgenerering', 'Alle kundesegmenter'], color: '#FF6B4A', popular: true },
  { id: 'unlimited', name: 'Unlimited', price: '149', icon: Rocket, features: ['Alt ubegrenset', 'Prioritert support', 'Tidlig tilgang', 'Alle fremtidige features'], color: '#7C5CFC' },
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

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  const numericValue = parseInt(value.replace(/[^0-9]/g, ''))

  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1500
    const increment = numericValue / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= numericValue) { setCount(numericValue); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, numericValue])

  return <span ref={ref}>{count.toLocaleString('nb-NO')}{suffix}</span>
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-display text-xl font-bold">Lead<span className="text-coral">Flow</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-[0.875rem] text-white/70 hover:text-white transition-colors font-medium">
              Logg inn
            </button>
            <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-xl text-[0.875rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
              Kom i gang gratis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 hero-grid">
        {/* Animated orbs */}
        <div className="absolute top-[20%] left-[15%] w-[400px] h-[400px] rounded-full opacity-20 blur-[80px] orb-1"
          style={{ background: 'radial-gradient(circle, #7C5CFC, transparent 70%)' }} />
        <div className="absolute bottom-[20%] right-[15%] w-[350px] h-[350px] rounded-full opacity-15 blur-[80px] orb-2"
          style={{ background: 'radial-gradient(circle, #FF6B4A, transparent 70%)' }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className={`transition-all duration-700 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] mb-8">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[0.8rem] text-white/60">Brukt av 120+ norske bedrifter</span>
            </div>

            <h1 className="font-display text-[3.5rem] md:text-[4.5rem] font-bold leading-[1.05] tracking-tight mb-6">
              Finn dine neste<br />
              <span className="gradient-text">kunder, enkelt</span>
            </h1>

            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              LeadFlow gir deg tilgang til hele Bronnoysundregistrene med enrichment, e-postmaler og CRM — alt du trenger for B2B-salg i Norge.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/login')}
                className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-[1rem] font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(255,107,74,0.3)]"
                style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                Start gratis
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-7 py-3.5 rounded-xl text-[1rem] font-medium border border-white/10 text-white/70 hover:bg-white/[0.04] hover:text-white transition-all">
                Se funksjoner
              </button>
            </div>
          </div>

          {/* Mock UI preview */}
          <div className={`mt-16 transition-all duration-1000 delay-300 ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative mx-auto max-w-3xl rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
              style={{ background: 'linear-gradient(135deg, rgba(26,23,48,0.9) 0%, rgba(13,11,26,0.95) 100%)' }}>
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-400/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                <div className="w-3 h-3 rounded-full bg-green-400/60" />
                <span className="ml-3 text-[0.75rem] text-white/30">app.leadflow.no</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {['Totalt leads', 'E-poster sendt', 'Samtaler ringt', 'Kontaktrate'].map((label, i) => (
                    <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                      <div className="text-[0.7rem] text-white/30 mb-1">{label}</div>
                      <div className="font-display text-xl font-bold text-white/80">
                        {['1,247', '892', '341', '67%'][i]}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[0.72rem] text-white/30 mb-2">Dine leadlister</div>
                    <div className="space-y-1.5">
                      {['Dyrebutikker Oslo', 'Frisor hele Norge', 'Hudpleie Bergen'].map((n, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full flex-1 bg-white/[0.06] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${[72, 45, 89][i]}%`, background: ['#FF6B4A', '#7C5CFC', '#2DD4BF'][i] }} />
                          </div>
                          <span className="text-[0.65rem] text-white/30 w-14 text-right">{n.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-40 h-24 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[0.72rem] text-white/30 mb-2">Siste aktivitet</div>
                    <div className="space-y-1">
                      {['Mail sendt', 'Ringt', 'Won!'].map((a, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ['#7C5CFC', '#2DD4BF', '#22C55E'][i] }} />
                          <span className="text-[0.6rem] text-white/30">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-16 blur-3xl opacity-20"
              style={{ background: 'linear-gradient(135deg, #FF6B4A, #7C5CFC)' }} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-20 border-y border-white/[0.06] relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {STATS.map((s, i) => (
              <div key={i} className={`text-center transition-all duration-500 ${statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="font-display text-[2.5rem] font-bold gradient-text mb-1">
                  <AnimatedCounter value={s.value} suffix={s.value.includes('+') ? '+' : s.value.includes('%') ? '%' : ''} />
                </div>
                <div className="text-[0.88rem] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" ref={featRef} className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-600 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2.5rem] font-bold mb-4">
              Alt du trenger for <span className="gradient-text">B2B-salg</span>
            </h2>
            <p className="text-lg text-white/40 max-w-xl mx-auto">
              Fra forste sok til lukket deal — LeadFlow dekker hele salgsprosessen.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i}
                  className={`group p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-1 hover:shadow-lg ${
                    featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{ background: `${f.color}15` }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2 text-white/90">{f.title}</h3>
                  <p className="text-[0.9rem] text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={priceRef} className="py-24 relative border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-600 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-[2.5rem] font-bold mb-4">
              Enkel <span className="gradient-text">prising</span>
            </h2>
            <p className="text-lg text-white/40">Start gratis, oppgrader nar du trenger mer.</p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon
              return (
                <div key={plan.id}
                  className={`relative p-8 rounded-2xl border transition-all duration-500 hover:-translate-y-1 ${
                    plan.popular ? 'border-coral/40 bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'
                  } ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[0.72rem] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #FF6B4A, #FF8F6B)' }}>
                      Mest populaer
                    </div>
                  )}

                  <Icon size={24} className="mb-3" style={{ color: plan.color }} />
                  <div className="text-[0.78rem] uppercase tracking-wider text-white/30 font-semibold">{plan.name}</div>

                  {plan.price === '0' ? (
                    <div className="font-display text-4xl font-bold mt-2 mb-6 text-white/90">Gratis</div>
                  ) : (
                    <div className="mt-2 mb-6">
                      <span className="font-display text-4xl font-bold text-white/90">{plan.price}</span>
                      <span className="text-white/40 ml-1">kr/mnd</span>
                    </div>
                  )}

                  <div className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-[0.88rem] text-white/60">
                        <Check size={16} className="text-green-400 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  <button onClick={() => navigate('/login')}
                    className={`w-full py-3 rounded-xl text-[0.9rem] font-semibold transition-all hover:-translate-y-0.5 ${
                      plan.popular
                        ? 'text-white hover:shadow-lg'
                        : 'border border-white/10 text-white/70 hover:bg-white/[0.04]'
                    }`}
                    style={plan.popular ? { background: 'linear-gradient(135deg, #FF6B4A, #FF8F6B)' } : {}}>
                    {plan.price === '0' ? 'Start gratis' : 'Kom i gang'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="p-12 rounded-3xl border border-white/[0.06] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,74,0.08) 0%, rgba(124,92,252,0.08) 100%)' }}>
            <h2 className="font-display text-[2rem] font-bold mb-4">
              Klar til a finne dine neste kunder?
            </h2>
            <p className="text-white/40 text-lg mb-8">
              Opprett en gratis konto pa under 30 sekunder.
            </p>
            <button onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[1rem] font-semibold text-white transition-all hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(255,107,74,0.3)]"
              style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
              Kom i gang gratis
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
              <span className="text-white font-bold text-[0.6rem]">L</span>
            </div>
            <span className="font-display text-sm font-bold text-white/40">LeadFlow</span>
          </div>
          <p className="text-[0.78rem] text-white/20">
            &copy; {new Date().getFullYear()} LeadFlow. Laget i Norge.
          </p>
        </div>
      </footer>
    </div>
  )
}
