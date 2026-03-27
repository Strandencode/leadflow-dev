import { useMemo, useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { useSavedLists } from '../hooks/useSavedLists'
import { Search, Plus, TrendingUp, Mail, Phone, Users, ListChecks, BarChart3, Kanban, ArrowRight, Sparkles } from 'lucide-react'
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

  // Check if new user for onboarding
  const [showOnboarding, setShowOnboarding] = useState(false)
  useEffect(() => {
    const dismissed = localStorage.getItem('leadflow_onboarding_done')
    const hasIcp = localStorage.getItem('leadflow_icp')
    if (!dismissed && !hasIcp && stats.totalLeads === 0) {
      setShowOnboarding(true)
    }
  }, [stats.totalLeads])

  function timeAgo(iso) {
    if (!iso) return ''
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Akkurat na'
    if (mins < 60) return `${mins}m siden`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}t siden`
    const days = Math.floor(hours / 24)
    return `${days}d siden`
  }

  const statCards = [
    { label: 'Totalt leads', value: stats.totalLeads, icon: Users, gradient: 'from-coral to-[#FF8F6B]', subtext: `${stats.totalLists} lagrede lister` },
    { label: 'E-poster sendt', value: stats.emailsSent, icon: Mail, gradient: 'from-violet to-[#A78BFA]', subtext: stats.totalLeads > 0 ? `${Math.round((stats.emailsSent / stats.totalLeads) * 100)}% av leads` : '0%' },
    { label: 'Samtaler ringt', value: stats.callsMade, icon: Phone, gradient: 'from-teal to-[#5EEAD4]', subtext: stats.totalLeads > 0 ? `${Math.round((stats.callsMade / stats.totalLeads) * 100)}% av leads` : '0%' },
    { label: 'Kontaktrate', value: `${stats.contactRate}%`, icon: BarChart3, gradient: 'from-amber-500 to-amber-400', subtext: `${stats.contacted} av ${stats.totalLeads} kontaktet` },
  ]

  const isEmpty = stats.totalLeads === 0

  return (
    <div>
      {/* Header */}
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-txt-secondary text-[0.9rem] mt-0.5">Velkommen tilbake, {firstName}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/search')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
            <Search size={16} /> Nytt sok
          </button>
          <button onClick={() => navigate('/search')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium text-white hover:-translate-y-0.5 hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
            <Plus size={16} /> Finn Leads
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {statCards.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className={`animate-in card-hover bg-surface-raised border border-bdr rounded-2xl p-6 relative overflow-hidden`}
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.gradient}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[0.78rem] text-txt-tertiary uppercase tracking-wide font-medium">{s.label}</div>
                    <div className="font-display text-[2.2rem] font-bold mt-1 leading-none">
                      <AnimatedNumber value={s.value} />
                    </div>
                    <div className="text-[0.78rem] text-txt-tertiary mt-2">{s.subtext}</div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Finn nye leads', desc: 'Sok i Bronnoysundregistrene', icon: Search, path: '/search', gradient: 'from-coral/10 to-coral/5', iconColor: '#FF6B4A' },
            { label: 'Pipeline', desc: 'Se salgsprosessen visuelt', icon: Kanban, path: '/pipeline', gradient: 'from-violet/10 to-violet/5', iconColor: '#7C5CFC' },
            { label: 'Analytics', desc: 'Oversikt og konvertering', icon: TrendingUp, path: '/analytics', gradient: 'from-teal/10 to-teal/5', iconColor: '#2DD4BF' },
          ].map((action, i) => {
            const Icon = action.icon
            return (
              <button key={i} onClick={() => navigate(action.path)}
                className={`animate-in delay-${i + 3} group flex items-center gap-4 p-5 rounded-2xl border border-bdr bg-gradient-to-br ${action.gradient} hover:-translate-y-0.5 hover:shadow-md transition-all text-left`}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white shadow-sm">
                  <Icon size={20} style={{ color: action.iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="text-[0.9rem] font-semibold">{action.label}</div>
                  <div className="text-[0.78rem] text-txt-tertiary">{action.desc}</div>
                </div>
                <ArrowRight size={16} className="text-txt-tertiary group-hover:translate-x-1 transition-transform" />
              </button>
            )
          })}
        </div>

        {isEmpty ? (
          <div className="animate-in delay-5 bg-surface-raised border border-bdr rounded-2xl p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(ellipse at center, rgba(124,92,252,0.08) 0%, transparent 70%)' }} />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,74,0.1), rgba(124,92,252,0.1))' }}>
                <Sparkles size={28} className="text-violet" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Kom i gang med LeadFlow!</h3>
              <p className="text-txt-tertiary text-[0.9rem] mb-8 max-w-md mx-auto">
                Start med a fyll ut ICP-profilen din, sok etter leads, og lagre din forste liste. Statistikken oppdateres automatisk.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => navigate('/icp')} className="px-5 py-2.5 border border-bdr rounded-xl font-medium text-[0.875rem] text-txt-secondary hover:bg-surface-sunken transition-all">
                  Fyll ut ICP
                </button>
                <button onClick={() => navigate('/search')}
                  className="px-5 py-2.5 rounded-xl font-medium text-[0.875rem] text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                  Finn leads →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* List overview */}
            <div className="animate-in delay-5 bg-surface-raised border border-bdr rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Dine leadlister</h3>
                <button onClick={() => navigate('/saved')} className="text-[0.8rem] text-txt-secondary hover:text-coral transition-colors font-medium">
                  Se alle →
                </button>
              </div>
              <div className="px-6 pb-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-2 border-b border-bdr">Liste</th>
                      <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-2 border-b border-bdr">Leads</th>
                      <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-2 border-b border-bdr">Sendt</th>
                      <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-2 border-b border-bdr">Ringt</th>
                      <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-2 border-b border-bdr">Fremgang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.listsSummary.slice(0, 6).map((l) => {
                      const contacted = l.emailedCount + l.calledCount
                      const pct = l.leadCount > 0 ? Math.min(100, Math.round((contacted / l.leadCount) * 100)) : 0
                      return (
                        <tr key={l.id} className="border-b border-surface-sunken last:border-0 cursor-pointer hover:bg-surface/50 transition-colors" onClick={() => navigate('/saved')}>
                          <td className="py-2.5 text-[0.88rem] font-medium">{l.name}</td>
                          <td className="py-2.5 text-[0.88rem] tabular-nums">{l.leadCount}</td>
                          <td className="py-2.5 text-[0.88rem] tabular-nums" style={{ color: '#7C5CFC' }}>{l.emailedCount}</td>
                          <td className="py-2.5 text-[0.88rem] tabular-nums" style={{ color: '#2DD4BF' }}>{l.calledCount}</td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 animate-expand"
                                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #FF6B4A, #FF8F6B)' }} />
                              </div>
                              <span className="text-[0.75rem] text-txt-tertiary tabular-nums w-8">{pct}%</span>
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
            <div className="animate-in delay-6 bg-surface-raised border border-bdr rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <h3 className="font-display text-lg font-semibold">Siste aktivitet</h3>
              </div>
              <div className="px-6 pb-6">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-txt-tertiary text-[0.88rem]">Ingen aktivitet enda. Send en e-post eller ring en kunde.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {stats.recentActivity.map((a, i) => (
                      <div key={i} className="flex gap-2.5 text-[0.85rem]">
                        <div className={`w-2 h-2 rounded-full mt-[7px] flex-shrink-0`}
                          style={{ background: a.type === 'email' ? '#7C5CFC' : '#2DD4BF' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-txt-secondary">
                            {a.type === 'email' ? 'E-post sendt til ' : 'Ringt '}
                            <strong className="text-txt-primary font-medium">{a.companyName}</strong>
                            {a.contactName && a.contactName !== '—' && <span className="text-txt-tertiary"> ({a.contactName})</span>}
                          </div>
                          <div className="text-[0.75rem] text-txt-tertiary">{timeAgo(a.date)}</div>
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

      {/* Onboarding wizard */}
      {showOnboarding && (
        <OnboardingWizard onDismiss={() => {
          setShowOnboarding(false)
          localStorage.setItem('leadflow_onboarding_done', 'true')
        }} />
      )}
    </div>
  )
}
