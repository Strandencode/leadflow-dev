import { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useSavedLists } from '../hooks/useSavedLists'
import { Search, Plus, TrendingUp, Mail, Phone, Users, BarChart3, Kanban, ArrowRight, Sparkles, Target, RefreshCw } from 'lucide-react'
import OnboardingWizard from '../components/OnboardingWizard'

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

  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    const dismissed = localStorage.getItem('leadflow_onboarding_done')
    const hasIcp = localStorage.getItem('leadflow_icp')
    if (!dismissed && !hasIcp && stats.totalLeads === 0) {
      setShowOnboarding(true)
    }
  }, [stats.totalLeads])

  function triggerOnboarding() {
    setShowOnboarding(true)
  }

  function timeAgo(iso) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Na'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}t`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  const statCards = [
    { label: 'Totalt leads', value: stats.totalLeads, icon: Users, color: '#3B82F6', subtext: `${stats.totalLists} lister` },
    { label: 'E-poster sendt', value: stats.emailsSent, icon: Mail, color: '#0051A8', subtext: stats.totalLeads > 0 ? `${Math.round((stats.emailsSent / stats.totalLeads) * 100)}%` : '0%' },
    { label: 'Samtaler', value: stats.callsMade, icon: Phone, color: '#10B981', subtext: stats.totalLeads > 0 ? `${Math.round((stats.callsMade / stats.totalLeads) * 100)}%` : '0%' },
    { label: 'Kontaktrate', value: `${stats.contactRate}%`, icon: BarChart3, color: '#8B5CF6', subtext: `${stats.contacted} av ${stats.totalLeads}` },
  ]

  const isEmpty = stats.totalLeads === 0

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F7' }}>
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-[1.6rem] font-normal tracking-tight text-ink">Dashboard</h1>
          <p className="text-txt-tertiary text-[0.82rem] mt-0.5 font-light">Velkommen tilbake, {firstName}.</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={triggerOnboarding} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium border border-gray-200 text-txt-secondary hover:bg-gray-50 transition-all">
            <RefreshCw size={15} /> Bytt mal
          </button>
          <button onClick={() => navigate('/search')} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium border border-gray-200 text-txt-secondary hover:bg-gray-50 transition-all">
            <Search size={15} /> Nytt sok
          </button>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all">
            <Plus size={15} /> Finn Leads
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="animate-in bg-white border border-gray-100 rounded-lg p-5 relative overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[0.7rem] text-txt-tertiary uppercase tracking-[0.1em] font-medium">{s.label}</div>
                    <div className="font-mono text-[1.8rem] font-medium mt-1 leading-none text-ink">
                      <AnimatedNumber value={s.value} />
                    </div>
                    <div className="text-[0.72rem] text-txt-tertiary mt-2 font-light">{s.subtext}</div>
                  </div>
                  <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: `${s.color}10` }}>
                    <Icon size={17} style={{ color: s.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Prospektering', desc: 'Sok i Bronnoysundregistrene', icon: Search, path: '/search', color: '#3B82F6' },
            { label: 'Pipeline', desc: 'Administrer salgsprosessen', icon: Kanban, path: '/pipeline', color: '#0051A8' },
            { label: 'Analytics', desc: 'Oversikt og metrikker', icon: TrendingUp, path: '/analytics', color: '#10B981' },
          ].map((action, i) => {
            const Icon = action.icon
            return (
              <button key={i} onClick={() => navigate(action.path)}
                className="animate-in group flex items-center gap-3.5 p-4 rounded-lg border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all text-left"
                style={{ animationDelay: `${(i + 4) * 0.06}s` }}>
                <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: `${action.color}08` }}>
                  <Icon size={17} style={{ color: action.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-[0.85rem] font-medium text-ink">{action.label}</div>
                  <div className="text-[0.72rem] text-txt-tertiary font-light">{action.desc}</div>
                </div>
                <ArrowRight size={14} className="text-txt-tertiary/50 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )
          })}
        </div>

        {isEmpty ? (
          <div className="animate-in delay-5 bg-white border border-gray-100 rounded-lg p-16 text-center">
            <div className="w-14 h-14 rounded-lg mx-auto mb-5 flex items-center justify-center border border-gold/15"
              style={{ background: 'rgba(201,168,76,0.05)' }}>
              <Target size={24} className="text-gold" />
            </div>
            <h3 className="font-display text-[1.3rem] font-normal mb-2 text-ink">Kom i gang med LeadFlow</h3>
            <p className="text-txt-tertiary text-[0.88rem] mb-8 max-w-md mx-auto font-light">
              Definer din ICP, sok etter leads og bygg din forste liste. Alle metrikker oppdateres i sanntid.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/icp')} className="px-5 py-2.5 border border-gray-200 rounded text-[0.82rem] font-medium text-txt-secondary hover:bg-gray-50 transition-all">
                Definer ICP
              </button>
              <button onClick={() => navigate('/search')}
                className="px-5 py-2.5 rounded text-[0.82rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all">
                Start prospektering
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            {/* List overview */}
            <div className="animate-in delay-5 bg-white border border-gray-100 rounded-lg overflow-hidden">
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
                        <tr key={l.id} className="border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => navigate('/saved')}>
                          <td className="py-2.5 text-[0.82rem] font-medium text-ink">{l.name}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono text-txt-secondary">{l.leadCount}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono" style={{ color: '#0051A8' }}>{l.emailedCount}</td>
                          <td className="py-2.5 text-[0.82rem] font-mono" style={{ color: '#10B981' }}>{l.calledCount}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
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
            <div className="animate-in delay-6 bg-white border border-gray-100 rounded-lg overflow-hidden">
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
          localStorage.setItem('leadflow_onboarding_done', 'true')
        }} />
      )}
    </div>
  )
}
