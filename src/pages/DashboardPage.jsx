import { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useSavedLists } from '../hooks/useSavedLists'
import { useICP } from '../hooks/useICP'
import { Search, Plus, TrendingUp, Mail, Phone, Users, BarChart3, Kanban, ArrowRight, Sparkles, Target, RefreshCw } from 'lucide-react'
import OnboardingWizard from '../components/OnboardingWizard'
import { BRAND, storageKey } from '../config/brand'

function AnimatedNumber({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const animated = useRef(false)

  useEffect(() => {
    if (animated.current) { setCount(value); return }
    const numVal = typeof value === 'string' ? parseInt(value) : value
    if (isNaN(numVal) || numVal === 0) { setCount(0); return }
    animated.current = true
    let start = 0
    const duration = 1200
    const increment = numVal / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= numVal) { setCount(numVal); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return <span className="animate-count">{typeof value === 'string' ? value : count.toLocaleString('nb-NO')}{suffix}</span>
}

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const { getStats } = useSavedLists()
  const stats = useMemo(() => getStats(), [getStats])

  const name = profile?.full_name || user?.user_metadata?.full_name || 'there'
  const firstName = name.split(' ')[0]

  const { icp } = useICP()
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey('onboarding_done'))
    const hasIcp = icp?.companyName || icp?.whatYouSell
    if (!dismissed && !hasIcp && stats.totalLeads === 0) {
      setShowOnboarding(true)
    }
  }, [stats.totalLeads, icp])

  function triggerOnboarding() {
    setShowOnboarding(true)
  }

  function timeAgo(iso) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Nå'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}t`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  // Brand system: Ink for baseline metrics, Sage inflection on the hero KPI (contact rate)
  const statCards = [
    { label: 'Totalt leads',   value: stats.totalLeads,  icon: Users,     color: '#07140E', hero: false, subtext: `${stats.totalLists} lister` },
    { label: 'E-poster sendt', value: stats.emailsSent,  icon: Mail,      color: '#07140E', hero: false, subtext: stats.totalLeads > 0 ? `${Math.round((stats.emailsSent / stats.totalLeads) * 100)}%` : '0%' },
    { label: 'Samtaler',       value: stats.callsMade,   icon: Phone,     color: '#07140E', hero: false, subtext: stats.totalLeads > 0 ? `${Math.round((stats.callsMade / stats.totalLeads) * 100)}%` : '0%' },
    { label: 'Kontaktrate',    value: `${stats.contactRate}%`, icon: BarChart3, color: '#8FB79A', hero: true,  subtext: `${stats.contacted} av ${stats.totalLeads}` },
  ]

  const isEmpty = stats.totalLeads === 0

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="px-8 py-5 bg-canvas border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <div className="mono-label mb-1" style={{ fontSize: '0.6rem' }}>OVERSIKT</div>
          <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-ink leading-none">Dashboard</h1>
          <p className="text-ink-muted text-[0.82rem] mt-1.5">Velkommen tilbake, {firstName}.</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={triggerOnboarding} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium border border-bdr text-ink-muted hover:bg-canvas-warm hover:text-ink transition-all">
            <RefreshCw size={15} /> Bytt mal
          </button>
          <button onClick={() => navigate('/search')} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium border border-bdr text-ink-muted hover:bg-canvas-warm hover:text-ink transition-all">
            <Search size={15} /> Nytt søk
          </button>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium text-canvas bg-ink hover:bg-ink-soft transition-all">
            <Plus size={15} /> Finn Leads
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats — monochrome Ink cards, one Sage-bright inflection */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i}
                className={`animate-in rounded-lg p-5 relative overflow-hidden border transition-all ${
                  s.hero
                    ? 'bg-ink border-ink text-canvas'
                    : 'bg-canvas-soft border-bdr text-ink'
                }`}
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="mono-label" style={{ fontSize: '0.6rem', color: s.hero ? 'rgba(244,240,230,0.6)' : undefined }}>{s.label}</div>
                    <div className={`font-display text-[1.9rem] font-bold mt-2 leading-none ${s.hero ? 'text-sage-bright' : 'text-ink'}`}>
                      <AnimatedNumber value={s.value} />
                    </div>
                    <div className={`text-[0.72rem] mt-2 ${s.hero ? 'text-canvas/60' : 'text-ink-subtle'}`}>{s.subtext}</div>
                  </div>
                  <div className={`w-9 h-9 rounded flex items-center justify-center ${s.hero ? 'bg-sage-bright/15' : 'bg-ink/5'}`}>
                    <Icon size={16} style={{ color: s.hero ? '#B8E0C3' : '#07140E' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions — unified monochrome */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Prospektering', desc: 'Søk i Brønnøysundregistrene', icon: Search, path: '/search' },
            { label: 'Pipeline', desc: 'Administrer salgsprosessen', icon: Kanban, path: '/pipeline' },
            { label: 'Analytics', desc: 'Oversikt og metrikker', icon: TrendingUp, path: '/analytics' },
          ].map((action, i) => {
            const Icon = action.icon
            return (
              <button key={i} onClick={() => navigate(action.path)}
                className="animate-in group flex items-center gap-3.5 p-4 rounded-lg border border-bdr bg-canvas-soft hover:border-ink/30 hover:shadow-card transition-all text-left"
                style={{ animationDelay: `${(i + 4) * 0.06}s` }}>
                <div className="w-9 h-9 rounded flex items-center justify-center bg-ink/[0.05]">
                  <Icon size={16} className="text-ink" />
                </div>
                <div className="flex-1">
                  <div className="text-[0.85rem] font-semibold text-ink">{action.label}</div>
                  <div className="text-[0.72rem] text-ink-muted">{action.desc}</div>
                </div>
                <ArrowRight size={14} className="text-ink-subtle group-hover:translate-x-0.5 group-hover:text-ink transition-all" />
              </button>
            )
          })}
        </div>

        {isEmpty ? (
          <div className="animate-in delay-5 bg-canvas-soft border border-bdr rounded-lg p-16 text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center bg-sage-bright/25">
              <Target size={22} className="text-ink" />
            </div>
            <h3 className="font-display text-[1.4rem] font-semibold mb-2 text-ink tracking-tight">Kom i gang med {BRAND.name}</h3>
            <p className="text-ink-muted text-[0.88rem] mb-8 max-w-md mx-auto">
              Definer din ICP, søk etter leads og bygg din første liste. Alle metrikker oppdateres i sanntid.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/icp')} className="px-5 py-2.5 border border-bdr rounded text-[0.82rem] font-medium text-ink-muted hover:text-ink hover:bg-canvas-warm transition-all">
                Definer ICP
              </button>
              <button onClick={() => navigate('/search')}
                className="px-5 py-2.5 rounded text-[0.82rem] font-medium text-canvas bg-ink hover:bg-ink-soft transition-all">
                Start prospektering
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            {/* List overview */}
            <div className="animate-in delay-5 bg-white border border-bdr rounded-lg overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h3 className="text-[0.88rem] font-medium text-ink">Leadlister</h3>
                <button onClick={() => navigate('/saved')} className="text-[0.75rem] text-txt-tertiary hover:text-gold transition-colors font-medium">
                  Se alle
                </button>
              </div>
              <div className="px-5 pb-5">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      {['Liste', 'Leads', 'Sendt', 'Ringt', 'Fremgang'].map(h => (
                        <th key={h} className="text-[0.65rem] uppercase tracking-[0.1em] text-txt-tertiary font-medium pb-2.5 border-b border-gray-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.listsSummary.slice(0, 6).map((l) => {
                      const contacted = l.emailedCount + l.calledCount
                      const pct = l.leadCount > 0 ? Math.min(100, Math.round((contacted / l.leadCount) * 100)) : 0
                      return (
                        <tr key={l.id} className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-canvas-warm/50 transition-colors" onClick={() => navigate('/saved')}>
                          <td className="py-2.5 text-[0.82rem] font-medium text-ink">{l.name}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono text-txt-secondary">{l.leadCount}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono" style={{ color: '#0051A8' }}>{l.emailedCount}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono" style={{ color: '#10B981' }}>{l.calledCount}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-canvas-warm rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 animate-expand"
                                  style={{ width: `${pct}%`, background: '#0051A8' }} />
                              </div>
                              <span className="text-[0.7rem] text-txt-tertiary font-mono w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent activity */}
            <div className="animate-in delay-6 bg-white border border-bdr rounded-lg overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-[0.88rem] font-medium text-ink">Siste aktivitet</h3>
              </div>
              <div className="px-5 pb-5">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-txt-tertiary text-[0.82rem] font-light">Ingen aktivitet enda.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.recentActivity.map((a, i) => (
                      <div key={i} className="flex gap-2.5 text-[0.8rem]">
                        <div className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0"
                          style={{ background: a.type === 'email' ? '#0051A8' : '#10B981' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-txt-secondary font-light">
                            {a.type === 'email' ? 'E-post til ' : 'Ringt '}
                            <strong className="text-ink font-medium">{a.companyName}</strong>
                          </div>
                          <div className="text-[0.7rem] text-txt-tertiary font-mono">{timeAgo(a.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showOnboarding && (
        <OnboardingWizard onDismiss={() => {
          setShowOnboarding(false)
          localStorage.setItem(storageKey('onboarding_done'), 'true')
        }} />
      )}
    </div>
  )
}
