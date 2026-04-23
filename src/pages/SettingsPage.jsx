import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import { useWorkspace } from '../hooks/useWorkspace'
import { useSavedLists } from '../hooks/useSavedLists'
import TEMPLATES, { getActiveTemplate, applyTemplate } from '../config/templates'
import { PLANS, PLAN_ORDER } from '../config/plans'
import toast from 'react-hot-toast'
import { Check, Crown, Users, Mail, Trash2, Plus, Shield, X, Slack, Loader2 } from 'lucide-react'
import { BRAND } from '../config/brand'
import { useIntegrations } from '../hooks/useIntegrations'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { planId, plan, usage, changePlan, enrichmentsLeft, isOnTrial, trialDaysLeft, refresh: refreshPlan } = usePlan()

  // Auto-refresh profile + plan on mount so users don't see stale
  // default_workspace_id from a pre-backfill session.
  useEffect(() => {
    refreshProfile?.()
    refreshPlan?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const { workspace, loading: wsLoading, role, inviteMember, removeMember, cancelInvite, updateMemberRole } = useWorkspace()
  const { getStats } = useSavedLists()
  const stats = useMemo(() => getStats(), [getStats])

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [company, setCompany] = useState(profile?.company_name || user?.user_metadata?.company_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' | 'yearly'
  const YEARLY_DISCOUNT = 0.2

  const enrichLimit = plan.limits.enrichments
  const enrichUsed = usage.enrichments || 0
  const enrichPct = enrichLimit === Infinity ? 0 : Math.min(100, Math.round((enrichUsed / enrichLimit) * 100))

  function handleSaveProfile() {
    toast.success('Profil oppdatert!')
  }

  async function handleSelectPlan(newPlanId) {
    if (newPlanId === planId) return
    if (newPlanId === 'enterprise') {
      window.open(`mailto:${BRAND.email.support}?subject=Enterprise-plan`, '_blank')
      return
    }
    // Owner-only via RLS — non-owners get an error back
    const res = await changePlan(newPlanId)
    if (res?.error) {
      if (res.error === 'no_workspace') {
        // Stale profile — refetch and ask user to retry
        await refreshProfile?.()
        await refreshPlan?.()
        toast.error('Workspace ikke lastet inn — prøv igjen')
      } else {
        toast.error('Bare workspace-eier kan endre plan')
      }
      return
    }
    // In production: redirect to Stripe checkout
    toast.success(`Byttet til ${PLANS[newPlanId].name}! 🎉`)
  }

  function handleCancelSubscription() {
    setShowCancelModal(false)
    toast(`Kontakt oss for å kansellere: ${BRAND.email.support}`, { icon: '📧' })
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return
    const result = await inviteMember(inviteEmail.trim(), inviteName.trim(), inviteRole)
    if (result?.error === 'already_member') { toast.error('Allerede medlem'); return }
    if (result?.error === 'already_invited') { toast.error('Allerede invitert'); return }
    if (result?.error === 'empty_email') { toast.error('Skriv inn en e-post'); return }
    if (result?.error === 'no_workspace') { toast.error('Ingen workspace funnet'); return }
    if (result?.error) { toast.error(result.error); return }
    toast.success(`Invitasjon sendt til ${inviteEmail} — de får en magic-link via e-post`)
    setInviteEmail(''); setInviteName(''); setShowInviteForm(false)
  }

  async function handleRemoveMember(id, name) {
    if (!window.confirm(`Fjerne ${name || 'medlemmet'} fra workspacet?`)) return
    const res = await removeMember(id)
    if (res?.error) toast.error(res.error)
    else toast.success('Medlem fjernet')
  }

  async function handleCancelInvite(id) {
    const res = await cancelInvite(id)
    if (res?.error) toast.error(res.error)
    else toast.success('Invitasjon kansellert')
  }

  async function handleRoleChange(id, role) {
    const res = await updateMemberRole(id, role)
    if (res?.error) toast.error(res.error)
    else toast.success('Rolle oppdatert')
  }

  return (
    <div>
      <div className="px-8 py-6 bg-canvas border-b border-bdr sticky top-0 z-40">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Innstillinger</h1>
        <p className="text-txt-secondary text-[0.9rem] mt-0.5">Administrer konto, abonnement og workspace</p>
      </div>

      <div className="p-8 max-w-[900px]">
        {/* Active template */}
        <div className="animate-in bg-canvas-soft border border-bdr rounded-lg p-6 mb-6">
          <h3 className="font-display text-[1.05rem] font-normal mb-1 text-ink">Bransjemal</h3>
          <p className="text-[0.82rem] text-txt-tertiary font-light mb-4">Malen bestemmer foreslåtte søk, e-postmaler og ICP-profil</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.filter(t => t.id !== 'general').map(t => {
              const isActive = getActiveTemplate().id === t.id
              return (
                <button key={t.id}
                  onClick={() => { applyTemplate(t.id); toast.success(`${t.name}-malen er aktivert!`); }}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                    isActive ? 'border-gold bg-gold/[0.04]' : 'border-bdr hover:border-bdr'
                  }`}>
                  <span className="text-xl">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.82rem] font-medium text-ink">{t.name}</div>
                    <div className="text-[0.7rem] text-txt-tertiary font-light truncate">{t.description}</div>
                  </div>
                  {isActive && <Check size={16} className="text-gold flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Current plan + usage */}
        <div className="animate-in delay-1 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold">Abonnement</h3>
            <div className="flex items-center gap-2">
              {isOnTrial && (
                <span className="px-3 py-1.5 rounded-full text-[0.78rem] font-semibold bg-sage-bright/30 text-sage sage-accent">
                  Prøveperiode — {trialDaysLeft} dager igjen
                </span>
              )}
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.82rem] font-semibold" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>
                {plan.icon} {plan.name}
              </span>
            </div>
          </div>

          {/* Usage */}
          <div className="p-4 bg-surface rounded-xl mb-5">
            <div className="flex justify-between text-[0.82rem] mb-2">
              <span className="text-txt-secondary">Enrichments brukt denne måneden</span>
              <span className="font-medium">{enrichUsed} / {enrichLimit === Infinity ? '∞' : enrichLimit}</span>
            </div>
            <div className="h-2.5 bg-surface-sunken rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${enrichPct > 80 ? 'bg-red-500' : 'bg-violet'}`}
                style={{ width: enrichLimit === Infinity ? '2%' : `${Math.max(enrichPct, 2)}%` }} />
            </div>
            {enrichPct > 80 && enrichLimit !== Infinity && (
              <p className="text-[0.75rem] text-[#C83A2E] mt-1.5">Nærmer seg grensen — vurder å oppgradere</p>
            )}
            <div className="flex gap-4 mt-3 text-[0.78rem] text-txt-tertiary">
              <span>{stats.totalLists} lister lagret</span>
              <span>{stats.totalLeads} totalt leads</span>
              <span>{stats.emailsSent} e-poster sendt</span>
            </div>
          </div>

          {!isOnTrial && (
            <div className="flex items-center justify-between pt-3 border-t border-surface-sunken">
              <div className="text-[0.82rem] text-txt-secondary">
                Fakturering: <strong className="text-txt-primary">{plan.priceLabel}/mnd</strong>
              </div>
              <button onClick={() => setShowCancelModal(true)} className="text-[0.82rem] text-red-400 hover:text-[#C83A2E] transition-colors">
                Kanseller abonnement
              </button>
            </div>
          )}
        </div>

        {/* Pricing plans */}
        <div className="animate-in delay-2 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
          <h3 className="font-display text-lg font-semibold mb-2">Prisplaner</h3>
          <p className="text-[0.85rem] text-txt-secondary mb-5">Velg planen som passer din bedrift</p>

          {/* Billing period toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-sunken border border-bdr">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded-full text-[0.8rem] font-medium transition-all ${
                  billingPeriod === 'monthly' ? 'bg-surface-raised text-txt-primary shadow-sm' : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Månedlig
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-4 py-1.5 rounded-full text-[0.8rem] font-medium transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'yearly' ? 'bg-surface-raised text-txt-primary shadow-sm' : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Årlig
                <span className="px-1.5 py-0.5 rounded-full text-[0.62rem] font-bold bg-sage-soft text-ink">−20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {PLAN_ORDER.map(id => {
              const p = PLANS[id]
              const isCurrent = planId === id
              const isYearly = billingPeriod === 'yearly'
              const monthlyPrice = p.price ? (isYearly ? Math.round(p.price * (1 - YEARLY_DISCOUNT)) : p.price) : null
              const yearlyTotal = p.price ? Math.round(p.price * (1 - YEARLY_DISCOUNT)) * 12 : null
              const yearlySavings = p.price ? p.price * 12 - yearlyTotal : 0
              return (
                <div key={id} className={`p-5 rounded-xl relative ${p.popular ? 'border-2 border-coral' : `border ${isCurrent ? 'border-violet' : 'border-bdr'}`}`}>
                  {p.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[0.62rem] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Mest populær
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <span className="text-xl">{p.icon}</span>
                    <div className="text-[0.72rem] uppercase tracking-wider text-txt-tertiary font-semibold mt-1">{p.name}</div>
                    {monthlyPrice !== null ? (
                      <>
                        <div className="font-display text-2xl font-bold mt-1">{monthlyPrice} kr</div>
                        <div className="text-[0.75rem] text-txt-secondary">/måned</div>
                        {isYearly ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-[0.68rem] text-txt-tertiary">
                              <span className="line-through">{p.price} kr</span> · {yearlyTotal} kr/år
                            </div>
                            <div className="text-[0.7rem] text-sage sage-accent font-medium">Spar {yearlySavings} kr/år</div>
                          </div>
                        ) : (
                          p.trialDays > 0 && (
                            <div className="text-[0.72rem] text-green-500 font-medium mt-0.5">{p.trialDays} dager gratis</div>
                          )
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-display text-2xl font-bold mt-1">{p.priceLabel}</div>
                      </>
                    )}
                  </div>

                  <div className="text-[0.78rem] text-txt-secondary space-y-1.5 mb-5">
                    {p.features.map(f => (
                      <div key={f} className="flex items-start gap-1.5">
                        <span className="text-green-500 flex-shrink-0 text-[0.7rem] mt-0.5">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    {(p.missing || []).map(f => (
                      <div key={f} className="flex items-start gap-1.5 text-txt-tertiary">
                        <span className="flex-shrink-0 text-[0.7rem] mt-0.5">—</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(id)}
                    disabled={isCurrent}
                    className={`w-full py-2.5 rounded-lg text-[0.82rem] font-semibold transition-all ${
                      isCurrent ? 'bg-surface-sunken text-txt-tertiary cursor-default' : p.ctaStyle
                    }`}
                  >
                    {isCurrent ? '✓ Nåværende' : p.cta}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-5 p-3 bg-surface rounded-xl text-center text-[0.78rem] text-txt-tertiary">
            {billingPeriod === 'yearly'
              ? 'Betaling via Stripe. Årsabonnement faktureres på forhånd. 14 dagers gratis prøveperiode.'
              : 'Betaling via Stripe. 14 dagers gratis prøveperiode. Kanseller når som helst — ingen binding.'}
          </div>
        </div>

        {/* Workspace / Team */}
        <div className="animate-in delay-3 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold">Workspace</h3>
              <p className="text-[0.85rem] text-txt-secondary mt-0.5">Samarbeid med teamet — del lister, pipeline og kunder</p>
            </div>
            {!plan.limits.workspace && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet/10 text-violet rounded-lg text-[0.78rem] font-medium">
                <Crown size={13}/> Krever Business
              </span>
            )}
          </div>

          {!plan.limits.workspace ? (
            <div className="p-6 border border-dashed border-bdr rounded-xl text-center">
              <Users size={32} className="mx-auto text-txt-tertiary/40 mb-3"/>
              <h4 className="text-[0.92rem] font-medium mb-1">Team-funksjoner krever Business-planen</h4>
              <p className="text-[0.82rem] text-txt-tertiary mb-4">Oppgrader for å invitere teammedlemmer og dele lister.</p>
              <button onClick={() => handleSelectPlan('business')} className="px-5 py-2.5 bg-violet text-white rounded-xl text-[0.85rem] font-medium hover:bg-violet/90 transition-all">
                Oppgrader til Business (999 kr/mnd)
              </button>
            </div>
          ) : wsLoading ? (
            <div className="p-6 text-center text-[0.82rem] text-txt-tertiary">Laster workspace…</div>
          ) : !workspace ? (
            <div className="p-6 border border-dashed border-bdr rounded-xl text-center">
              <Users size={32} className="mx-auto text-txt-tertiary/40 mb-3"/>
              <h4 className="text-[0.92rem] font-medium mb-2">Ingen workspace funnet</h4>
              <p className="text-[0.82rem] text-txt-tertiary">
                Et workspace opprettes automatisk når du registrerer deg. Logg ut og inn igjen, eller kontakt support hvis dette vedvarer.
              </p>
            </div>
          ) : (() => {
            const canManage = role === 'owner' || role === 'admin'
            return (
            <div>
              {/* Workspace info */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl mb-4">
                <div>
                  <div className="text-[0.88rem] font-medium">{workspace.name}</div>
                  <div className="text-[0.75rem] text-txt-tertiary">
                    {workspace.members.length} medlem{workspace.members.length > 1 ? 'mer' : ''}
                    {' · Din rolle: '}<span className="font-medium text-txt-secondary capitalize">{role || '—'}</span>
                    {' · Opptil '}{plan.limits.maxUsers === Infinity ? 'ubegrenset' : plan.limits.maxUsers}{' brukere'}
                  </div>
                </div>
              </div>

              {/* Members list */}
              <div className="space-y-2 mb-4">
                {workspace.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-sunken/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-violet/10 flex items-center justify-center text-violet font-semibold text-[0.82rem]">
                      {((m.name || m.email || '?').charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.85rem] font-medium">{m.name || (m.email ? m.email.split('@')[0] : 'Ukjent')}</div>
                      <div className="text-[0.72rem] text-txt-tertiary">{m.email || '—'}</div>
                    </div>
                    {canManage ? (
                      <select
                        value={m.role}
                        onChange={e => handleRoleChange(m.id, e.target.value)}
                        disabled={m.role === 'owner'}
                        className="px-2.5 py-1 bg-surface border border-bdr rounded-lg text-[0.75rem] outline-none disabled:opacity-50"
                      >
                        <option value="owner">Eier</option>
                        <option value="admin">Admin</option>
                        <option value="member">Medlem</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 text-[0.72rem] text-txt-tertiary capitalize">{m.role}</span>
                    )}
                    {canManage && m.role !== 'owner' && (
                      <button onClick={() => handleRemoveMember(m.id, m.name)} className="p-1.5 rounded-lg hover:bg-rose/30 text-txt-tertiary hover:text-[#C83A2E] transition-all">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                ))}

                {/* Pending invites */}
                {workspace.pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-butter/40/50 border border-amber-100">
                    <div className="w-9 h-9 rounded-full bg-butter/60 flex items-center justify-center text-ember">
                      <Mail size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.85rem] font-medium text-amber-800">{inv.email}</div>
                      <div className="text-[0.72rem] text-ember">Venter på svar</div>
                    </div>
                    {canManage && (
                      <button onClick={() => handleCancelInvite(inv.id)} className="p-1.5 rounded-lg hover:bg-rose/30 text-txt-tertiary hover:text-[#C83A2E] transition-all" title="Kanseller invitasjon">
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite form — only visible to owner/admin */}
              {canManage ? (
                showInviteForm ? (
                  <div className="p-4 border border-bdr rounded-xl space-y-3">
                    <h4 className="text-[0.85rem] font-semibold">Inviter nytt medlem</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="E-post" className="px-3 py-2 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none focus:border-violet col-span-1"/>
                      <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Navn (valgfritt)" className="px-3 py-2 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none focus:border-violet"/>
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="px-3 py-2 bg-surface border border-bdr rounded-lg text-[0.85rem] outline-none">
                        <option value="member">Medlem</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowInviteForm(false)} className="px-3 py-1.5 text-[0.82rem] text-txt-secondary hover:text-txt-primary transition-colors">Avbryt</button>
                      <button onClick={handleInvite} disabled={!inviteEmail.trim()} className="px-4 py-1.5 bg-violet text-white rounded-lg text-[0.82rem] font-medium hover:bg-violet/90 disabled:opacity-40 transition-all">
                        Send invitasjon
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowInviteForm(true)}
                    disabled={workspace.members.length >= plan.limits.maxUsers}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-bdr rounded-xl text-[0.82rem] text-txt-secondary hover:border-violet hover:text-violet disabled:opacity-40 transition-all"
                  >
                    <Plus size={14}/> Inviter nytt medlem
                    {plan.limits.maxUsers !== Infinity && ` (${workspace.members.length}/${plan.limits.maxUsers})`}
                  </button>
                )
              ) : (
                <p className="text-center text-[0.78rem] text-txt-tertiary py-2">
                  Kun eier eller admin kan invitere medlemmer.
                </p>
              )}
            </div>
            )
          })()}
        </div>

        {/* Integrations — Slack webhooks */}
        <IntegrationsSection />

        {/* Profile */}
        <div className="animate-in delay-5 bg-surface-raised border border-bdr rounded-xl p-8">
          <h3 className="font-display text-lg font-semibold mb-6">Profil</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Fullt navn</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">E-post</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Selskap</label>
              <input value={company} onChange={e => setCompany(e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Telefon</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+47 900 12 345" className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveProfile} className="px-5 py-2.5 bg-coral text-white rounded-lg font-medium text-[0.875rem] hover:bg-coral-hover transition-all">
              Lagre endringer
            </button>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold mb-2">Kanseller abonnement?</h3>
            <p className="text-[0.88rem] text-txt-secondary mb-6">
              Send en e-post til <strong>{BRAND.email.support}</strong> for å kansellere. Du beholder tilgang ut inneværende periode.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelModal(false)} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
                Lukk
              </button>
              <button onClick={handleCancelSubscription} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium bg-coral text-white hover:bg-coral-hover transition-all">
                Send e-post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Integrations — Slack webhook
// ---------------------------------------------------------------------------

const SLACK_EVENTS = [
  {
    id:        'new_lead',
    label:     'Ny lead opprettet',
    desc:      'Varsle Slack når et nytt kort legges til i «Ny Lead»-stadiet.',
    available: true,
  },
  {
    id:        'offer_signed',
    label:     'Tilbud signert',
    desc:      'Varsle når en kunde signerer kontrakt. Kommer snart.',
    available: false,
  },
]

function IntegrationsSection() {
  const { slackWebhookUrl, slackEvents, loading, saving, saveSlack } = useIntegrations()
  const [url, setUrl]       = useState('')
  const [events, setEvents] = useState([])
  const [dirty, setDirty]   = useState(false)

  // Sync form state when the hook finishes loading
  useEffect(() => {
    if (!loading) {
      setUrl(slackWebhookUrl || '')
      setEvents(slackEvents || [])
      setDirty(false)
    }
  }, [loading, slackWebhookUrl, slackEvents])

  function toggleEvent(id, available) {
    if (!available) return
    setDirty(true)
    setEvents(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  async function handleSave() {
    const res = await saveSlack({ webhookUrl: url, events })
    if (res?.error === 'invalid_slack_url') {
      toast.error('Slack webhook-URL må starte med https://hooks.slack.com/services/')
      return
    }
    if (res?.error) { toast.error(res.error); return }
    setDirty(false)
    toast.success(url ? 'Slack-kobling lagret' : 'Slack-kobling deaktivert')
  }

  const enabled = Boolean(url)

  return (
    <div className="animate-in delay-4 bg-surface-raised border border-bdr rounded-xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display text-lg font-semibold flex items-center gap-2">
            <Slack size={18} className="text-txt-secondary" /> Integrasjoner
          </h3>
          <p className="text-[0.85rem] text-txt-tertiary mt-1">
            Koble Vekstor til Slack og andre verktøy. Varsler sendes til en Incoming Webhook du oppretter i Slack.
          </p>
        </div>
        {enabled && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage-soft text-ink text-[0.72rem] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sage" /> Aktiv
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-txt-tertiary text-sm"><Loader2 size={14} className="animate-spin" /> Laster…</div>
      ) : (
        <>
          <div className="mb-5">
            <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">
              Slack Webhook URL
            </label>
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setDirty(true) }}
              placeholder="https://hooks.slack.com/services/{team}/{channel}/{token}"
              className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-lg text-[0.88rem] font-mono outline-none focus:border-ink focus:ring-2 focus:ring-sage-bright/30 transition-all"
            />
            <p className="text-[0.72rem] text-txt-tertiary mt-1.5">
              Opprett en Incoming Webhook i Slack:{' '}
              <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                api.slack.com/messaging/webhooks
              </a>
              . Tom URL slår av integrasjonen.
            </p>
          </div>

          <div>
            <div className="text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-3">
              Hendelser som sender varsel
            </div>
            <div className="space-y-2">
              {SLACK_EVENTS.map(ev => {
                const checked = events.includes(ev.id)
                return (
                  <label
                    key={ev.id}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border transition-all ${
                      !ev.available
                        ? 'border-bdr bg-surface-sunken opacity-50 cursor-not-allowed'
                        : checked
                          ? 'border-ink/30 bg-sage-bright/10 cursor-pointer'
                          : 'border-bdr bg-surface hover:border-ink/20 cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!ev.available}
                      onChange={() => toggleEvent(ev.id, ev.available)}
                      className="mt-0.5 accent-ink"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.88rem] font-semibold text-ink">{ev.label}</span>
                        {!ev.available && (
                          <span className="text-[0.64rem] font-semibold tracking-wider uppercase text-txt-tertiary bg-surface-sunken border border-bdr px-1.5 py-0.5 rounded">
                            Kommer snart
                          </span>
                        )}
                      </div>
                      <p className="text-[0.78rem] text-txt-tertiary mt-0.5">{ev.desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {dirty && <span className="text-[0.78rem] text-txt-tertiary">Ulagrede endringer</span>}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium text-canvas bg-ink hover:bg-ink-soft transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (<span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Lagrer…</span>) : 'Lagre'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
