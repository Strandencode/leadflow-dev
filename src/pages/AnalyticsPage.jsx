import { useMemo } from 'react'
import { useSavedLists } from '../hooks/useSavedLists'
import { useCustomers } from '../hooks/useCustomers'
import { usePipeline, STAGES } from '../hooks/usePipeline'
import { TrendingUp, Users, Mail, Phone, Trophy, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react'

function FunnelBar({ label, count, total, color, emoji }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-[0.88rem] font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold">{count.toLocaleString('nb-NO')}</span>
          <span className="text-[0.78rem] text-txt-tertiary">({pct}%)</span>
        </div>
      </div>
      <div className="h-10 bg-surface-sunken rounded-xl overflow-hidden">
        <div className="h-full rounded-xl transition-all duration-1000 animate-expand flex items-center px-4"
          style={{ width: `${Math.max(pct, 3)}%`, background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          {pct >= 15 && <span className="text-white text-[0.75rem] font-semibold">{pct}%</span>}
        </div>
      </div>
    </div>
  )
}

function MiniBarChart({ data, maxValue }) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              background: d.color || 'linear-gradient(180deg, #7C5CFC, #A78BFA)',
              animationDelay: `${i * 50}ms`
            }} />
          <span className="text-[0.55rem] text-txt-tertiary whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { lists, getTracking } = useSavedLists()
  const { customers } = useCustomers()
  const { getStageCounts } = usePipeline()

  const stats = useMemo(() => {
    const allCompanies = lists.flatMap(l => l.companies || [])
    const uniqueOrgs = new Set(allCompanies.map(c => c.orgNumber))
    const totalLeads = uniqueOrgs.size

    let emailed = 0, called = 0
    const trackingData = {}
    for (const c of allCompanies) {
      if (trackingData[c.orgNumber]) continue
      const t = getTracking(c.orgNumber)
      trackingData[c.orgNumber] = t
      if (t.emailed) emailed++
      if (t.called) called++
    }

    const contacted = Object.values(trackingData).filter(t => t.emailed || t.called).length
    const won = customers.length

    // Per list stats
    const listStats = lists.map(l => {
      const lEmailed = (l.companies || []).filter(c => getTracking(c.orgNumber).emailed).length
      const lCalled = (l.companies || []).filter(c => getTracking(c.orgNumber).called).length
      const lContacted = (l.companies || []).filter(c => {
        const t = getTracking(c.orgNumber)
        return t.emailed || t.called
      }).length
      const contactRate = l.leadCount > 0 ? Math.round((lContacted / l.leadCount) * 100) : 0
      return { ...l, emailed: lEmailed, called: lCalled, contacted: lContacted, contactRate }
    }).sort((a, b) => b.contactRate - a.contactRate)

    // Activity by day (last 7 days)
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString('nb-NO', { weekday: 'short' })
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      const dayEnd = dayStart + 86400000

      let emailCount = 0, callCount = 0
      for (const t of Object.values(trackingData)) {
        if (t.emailed && t.emailedAt) {
          const ts = new Date(t.emailedAt).getTime()
          if (ts >= dayStart && ts < dayEnd) emailCount++
        }
        if (t.called && t.calledAt) {
          const ts = new Date(t.calledAt).getTime()
          if (ts >= dayStart && ts < dayEnd) callCount++
        }
      }
      days.push({ label: dayStr, emails: emailCount, calls: callCount, value: emailCount + callCount })
    }

    const pipelineCounts = getStageCounts()

    return { totalLeads, emailed, called, contacted, won, listStats, days, pipelineCounts }
  }, [lists, customers, getTracking, getStageCounts])

  const conversionRate = stats.totalLeads > 0 ? ((stats.won / stats.totalLeads) * 100).toFixed(1) : '0'
  const contactRate = stats.totalLeads > 0 ? Math.round((stats.contacted / stats.totalLeads) * 100) : 0

  return (
    <div>
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr sticky top-0 z-40">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-txt-secondary text-[0.9rem] mt-0.5">Oversikt over salgsaktivitet og konvertering</p>
      </div>

      <div className="p-8 max-w-[1100px]">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Totalt leads', value: stats.totalLeads, icon: Users, color: '#FF6B4A', gradient: 'from-coral to-[#FF8F6B]' },
            { label: 'Kontaktet', value: stats.contacted, icon: Mail, color: '#7C5CFC', gradient: 'from-violet to-[#A78BFA]', sub: `${contactRate}% kontaktrate` },
            { label: 'Kunder vunnet', value: stats.won, icon: Trophy, color: '#22C55E', gradient: 'from-green-500 to-emerald-400', sub: `${conversionRate}% konverteringsrate` },
            { label: 'Siste 7 dager', value: stats.days.reduce((s, d) => s + d.value, 0), icon: TrendingUp, color: '#2DD4BF', gradient: 'from-teal to-[#5EEAD4]', sub: 'aktiviteter' },
          ].map((kpi, i) => {
            const Icon = kpi.icon
            return (
              <div key={i} className="animate-in card-hover bg-surface-raised border border-bdr rounded-2xl p-6 relative overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s` }}>
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.gradient}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[0.78rem] text-txt-tertiary uppercase tracking-wide font-medium mb-1">{kpi.label}</div>
                    <div className="font-display text-[2rem] font-bold leading-none">{kpi.value.toLocaleString('nb-NO')}</div>
                    {kpi.sub && <div className="text-[0.75rem] text-txt-tertiary mt-1.5">{kpi.sub}</div>}
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}12` }}>
                    <Icon size={20} style={{ color: kpi.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-6 mb-8">
          {/* Conversion Funnel */}
          <div className="animate-in delay-3 bg-surface-raised border border-bdr rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-6">Konverteringstrakt</h3>
            <div className="space-y-4">
              <FunnelBar label="Totalt leads" count={stats.totalLeads} total={stats.totalLeads} color="#6B6589" emoji="👥" />
              <FunnelBar label="Kontaktet" count={stats.contacted} total={stats.totalLeads} color="#7C5CFC" emoji="📧" />
              <FunnelBar label="Kunder (Won)" count={stats.won} total={stats.totalLeads} color="#22C55E" emoji="🏆" />
            </div>

            {stats.totalLeads > 0 && (
              <div className="mt-6 p-4 rounded-xl bg-surface-sunken/50">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-[0.72rem] text-txt-tertiary uppercase tracking-wide mb-1">Kontaktrate</div>
                    <div className="font-display text-2xl font-bold" style={{ color: '#7C5CFC' }}>{contactRate}%</div>
                  </div>
                  <div>
                    <div className="text-[0.72rem] text-txt-tertiary uppercase tracking-wide mb-1">Win-rate</div>
                    <div className="font-display text-2xl font-bold" style={{ color: '#22C55E' }}>{conversionRate}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Chart */}
          <div className="animate-in delay-4 bg-surface-raised border border-bdr rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-2">Aktivitet siste 7 dager</h3>
            <p className="text-[0.82rem] text-txt-tertiary mb-6">{stats.days.reduce((s, d) => s + d.value, 0)} aktiviteter totalt</p>

            <div className="flex items-end gap-2 h-32 mb-4">
              {stats.days.map((d, i) => {
                const max = Math.max(...stats.days.map(x => x.emails + x.calls), 1)
                const emailH = max > 0 ? (d.emails / max) * 100 : 0
                const callH = max > 0 ? (d.calls / max) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: `${Math.max(emailH + callH, 4)}%` }}>
                      {d.emails > 0 && (
                        <div className="w-full rounded-t-md flex-1" style={{ background: 'linear-gradient(180deg, #7C5CFC, #A78BFA)', minHeight: '4px' }} />
                      )}
                      {d.calls > 0 && (
                        <div className="w-full rounded-b-md flex-1" style={{ background: 'linear-gradient(180deg, #2DD4BF, #5EEAD4)', minHeight: '4px' }} />
                      )}
                      {d.emails === 0 && d.calls === 0 && (
                        <div className="w-full rounded-md bg-surface-sunken" style={{ height: '4px' }} />
                      )}
                    </div>
                    <span className="text-[0.6rem] text-txt-tertiary mt-1">{d.label}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4 text-[0.78rem]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#7C5CFC' }} />
                <span className="text-txt-secondary">E-poster ({stats.emailed})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#2DD4BF' }} />
                <span className="text-txt-secondary">Samtaler ({stats.called})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="animate-in delay-5 bg-surface-raised border border-bdr rounded-2xl p-6 mb-8">
          <h3 className="font-display text-lg font-semibold mb-6">Pipeline-fordeling</h3>
          <div className="grid grid-cols-4 gap-4">
            {STAGES.map(stage => {
              const count = stats.pipelineCounts[stage.id] || 0
              const total = Object.values(stats.pipelineCounts).reduce((s, c) => s + c, 0) || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={stage.id} className="text-center p-4 rounded-xl bg-surface-sunken/50">
                  <span className="text-2xl mb-2 block">{stage.emoji}</span>
                  <div className="font-display text-2xl font-bold" style={{ color: stage.color }}>{count}</div>
                  <div className="text-[0.78rem] text-txt-secondary font-medium">{stage.label}</div>
                  <div className="text-[0.68rem] text-txt-tertiary">{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Lists */}
        {stats.listStats.length > 0 && (
          <div className="animate-in delay-6 bg-surface-raised border border-bdr rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold mb-6">Listeoversikt</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-3 border-b border-bdr">Liste</th>
                  <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-3 border-b border-bdr text-right">Leads</th>
                  <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-3 border-b border-bdr text-right">Sendt</th>
                  <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-3 border-b border-bdr text-right">Ringt</th>
                  <th className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold pb-3 border-b border-bdr text-right">Kontaktrate</th>
                </tr>
              </thead>
              <tbody>
                {stats.listStats.slice(0, 8).map((l, i) => (
                  <tr key={l.id} className="border-b border-surface-sunken last:border-0 hover:bg-surface/30 transition-colors">
                    <td className="py-3 text-[0.88rem] font-medium">{l.name}</td>
                    <td className="py-3 text-[0.88rem] tabular-nums text-right">{l.leadCount}</td>
                    <td className="py-3 text-[0.88rem] tabular-nums text-right" style={{ color: '#7C5CFC' }}>{l.emailed}</td>
                    <td className="py-3 text-[0.88rem] tabular-nums text-right" style={{ color: '#2DD4BF' }}>{l.called}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-surface-sunken rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${l.contactRate}%`, background: l.contactRate > 60 ? '#22C55E' : l.contactRate > 30 ? '#FF6B4A' : '#9E98B5' }} />
                        </div>
                        <span className="text-[0.82rem] font-medium tabular-nums w-8 text-right">{l.contactRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats.totalLeads === 0 && (
          <div className="text-center py-16">
            <BarChart3 size={48} className="mx-auto text-txt-tertiary/30 mb-4" />
            <h3 className="font-display text-lg font-semibold text-txt-secondary mb-2">Ingen data enda</h3>
            <p className="text-txt-tertiary text-[0.9rem] max-w-md mx-auto">
              Sok etter leads, lagre lister og begynn a ta kontakt. Statistikken oppdateres automatisk.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
