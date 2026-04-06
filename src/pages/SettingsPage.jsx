import { useState, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePlan } from '../hooks/usePlan'
import { useWorkspace } from '../hooks/useWorkspace'
import { useSavedLists } from '../hooks/useSavedLists'
import TEMPLATES, { getActiveTemplate, applyTemplate } from '../config/templates'
import { PLANS, PLAN_ORDER } from '../config/plans'
import toast from 'react-hot-toast'
import { Check, Crown, Users, Mail, Trash2, Plus, Shield, X } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { planId, plan, usage, changePlan, enrichmentsLeft } = usePlan()
  const { workspace, createWorkspace, inviteMember, removeMember, cancelInvite, acceptInvite, updateMemberRole } = useWorkspace()
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

  const enrichLimit = plan.limits.enrichments
  const enrichUsed = usage.enrichments || 0
  const enrichPct = enrichLimit === Infinity ? 0 : Math.min(100, Math.round((enrichUsed / enrichLimit) * 100))

  function handleSaveProfile() {
    toast.success('Profil oppdatert!')
  }

  function handleSelectPlan(newPlanId) {
    if (newPlanId === planId) return
    if (newPlanId === 'starter' && planId !== 'starter') {
      setShowCancelModal(true)
      return
    }
    if (newPlanId === 'enterprise') {
      window.open('mailto:kontakt@leadflow.no?subject=Enterprise-plan', '_blank')
      return
    }
    // In production: redirect to Stripe checkout
    changePlan(newPlanId)
    toast.success(`Oppgradert til ${PLANS[newPlanId].name}! 🎉`)
  }

  function handleCancelSubscription() {
    changePlan('starter')
    setShowCancelModal(false)
    toast.success('Nedgradert til Starter')
  }

  function handleCreateWorkspace() {
    createWorkspace(company || 'Mitt Workspace', email, fullName || 'Eier')
    toast.success('Workspace opprettet!')
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return
    const result = inviteMember(inviteEmail.trim(), inviteName.trim(), inviteRole)
    if (result === 'already_member') { toast.error('Allerede medlem'); return }
    if (result === 'already_invited') { toast.error('Allerede invitert'); return }
    toast.success(`Invitasjon sendt til ${inviteEmail}`)
    setInviteEmail(''); setInviteName(''); setShowInviteForm(false)
  }

  return (
    <div>
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr sticky top-0 z-40">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Innstillinger</h1>
        <p className="text-txt-secondary text-[0.9rem] mt-0.5">Administrer konto, abonnement og workspace</p>
      </div>

      <div className="p-8 max-w-[900px]">
        {/* Active template */}
        <div className="animate-in bg-white border border-gray-100 rounded-lg p-6 mb-6">
          <h3 className="font-display text-[1.05rem] font-normal mb-1 text-ink">Bransjemal</h3>
          <p className="text-[0.82rem] text-txt-tertiary font-light mb-4">Malen bestemmer foreslåtte søk, e-postmaler og ICP-profil</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.filter(t => t.id !== 'general').map(t => {
              const isActive = getActiveTemplate().id === t.id
              return (
                <button key={t.id}
                  onClick={() => { applyTemplate(t.id); toast.success(`${t.name}-malen er aktivert!`); }}
                  className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                    isActive ? 'border-gold bg-gold/[0.04]' : 'border-gray-100 hover:border-gray-200'
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
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.82rem] font-semibold" style={{ backgroundColor: `${plan.color}15`, color: plan.color }}>
              {plan.icon} {plan.name}
            </span>
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
              <p className="text-[0.75rem] text-red-500 mt-1.5">Nærmer seg grensen — vurder å oppgradere</p>
            )}
            <div className="flex gap-4 mt-3 text-[0.78rem] text-txt-tertiary">
              <span>{stats.totalLists} lister lagret</span>
              <span>{stats.totalLeads} totalt leads</span>
              <span>{stats.emailsSent} e-poster sendt</span>
            </div>
          </div>

          {planId !== 'starter' && (
            <div className="flex items-center justify-between pt-3 border-t border-surface-sunken">
              <div className="text-[0.82rem] text-txt-secondary">
                Fakturering: <strong className="text-txt-primary">{plan.priceLabel}/mnd</strong>
              </div>
              <button onClick={() => setShowCancelModal(true)} className="text-[0.82rem] text-red-400 hover:text-red-500 transition-colors">
                Kanseller abonnement
              </button>
            </div>
          )}
        </div>

        {/* Pricing plans */}
        <div className="animate-in delay-2 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
          <h3 className="font-display text-lg font-semibold mb-2">Prisplaner</h3>
          <p className="text-[0.85rem] text-txt-secondary mb-6">Velg planen som passer din bedrift</p>

          <div className="grid grid-cols-4 gap-4">
            {PLAN_ORDER.map(id => {
              const p = PLANS[id]
              const isCurrent = planId === id
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
                    {p.price === 0 ? (
                      <div className="font-display text-2xl font-bold mt-1">Gratis</div>
                    ) : (
                      <>
                        <div className="font-display text-2xl font-bold mt-1">{p.priceLabel}</div>
                        <div className="text-[0.75rem] text-txt-secondary">/måned</div>
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
            Betaling via Stripe. Kanseller når som helst — du beholder tilgang ut måneden. 14 dagers gratis prøveperiode på alle betalte planer.
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
          ) : !workspace ? (
            <div className="p-6 border border-dashed border-bdr rounded-xl text-center">
              <Users size={32} className="mx-auto text-txt-tertiary/40 mb-3"/>
              <h4 className="text-[0.92rem] font-medium mb-2">Opprett et workspace</h4>
              <p className="text-[0.82rem] text-txt-tertiary mb-4">Start et workspace for å invitere teammedlemmer.</p>
              <button onClick={handleCreateWorkspace} className="px-5 py-2.5 bg-violet text-white rounded-xl text-[0.85rem] font-medium hover:bg-violet/90 transition-all">
                <Plus size={14} className="inline mr-1"/> Opprett workspace
              </button>
            </div>
          ) : (
            <div>
              {/* Workspace info */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl mb-4">
                <div>
                  <div className="text-[0.88rem] font-medium">{workspace.name}</div>
                  <div className="text-[0.75rem] text-txt-tertiary">{workspace.members.length} medlem{workspace.members.length > 1 ? 'mer' : ''} · Opptil {plan.limits.maxUsers === Infinity ? 'ubegrenset' : plan.limits.maxUsers} brukere</div>
                </div>
              </div>

              {/* Members list */}
              <div className="space-y-2 mb-4">
                {workspace.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-sunken/50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-violet/10 flex items-center justify-center text-violet font-semibold text-[0.82rem]">
                      {(m.name || m.email)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.85rem] font-medium">{m.name || m.email.split('@')[0]}</div>
                      <div className="text-[0.72rem] text-txt-tertiary">{m.email}</div>
                    </div>
                    <select
                      value={m.role}
                      onChange={e => updateMemberRole(m.id, e.target.value)}
                      disabled={m.role === 'owner'}
                      className="px-2.5 py-1 bg-surface border border-bdr rounded-lg text-[0.75rem] outline-none disabled:opacity-50"
                    >
                      <option value="owner">Eier</option>
                      <option value="admin">Admin</option>
                      <option value="member">Medlem</option>
                    </select>
                    {m.role !== 'owner' && (
                      <button onClick={() => { removeMember(m.id); toast.success('Medlem fjernet') }} className="p-1.5 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-500 transition-all">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                ))}

                {/* Pending invites */}
                {workspace.pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Mail size={14}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.85rem] font-medium text-amber-800">{inv.email}</div>
                      <div className="text-[0.72rem] text-amber-600">Venter på svar</div>
                    </div>
                    <button onClick={() => { acceptInvite(inv.id); toast.success('Invitasjon godkjent (demo)') }} className="px-2.5 py-1 rounded-lg text-[0.72rem] font-medium bg-green-500 text-white hover:bg-green-600 transition-all">
                      Simuler godkjenning
                    </button>
                    <button onClick={() => { cancelInvite(inv.id); toast.success('Invitasjon trukket tilbake') }} className="p-1.5 rounded-lg hover:bg-red-50 text-txt-tertiary hover:text-red-500 transition-all">
                      <X size={14}/>
                    </button>
                  </div>
                ))}
              </div>

              {/* Invite form */}
              {showInviteForm ? (
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
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="animate-in delay-4 bg-surface-raised border border-bdr rounded-xl p-8">
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
            <h3 className="font-display text-xl font-semibold mb-2">Nedgrader til Starter?</h3>
            <p className="text-[0.88rem] text-txt-secondary mb-6">
              Du mister tilgang til enrichment, ubegrensede resultater, CSV-eksport og workspace.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelModal(false)} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
                Behold plan
              </button>
              <button onClick={handleCancelSubscription} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium bg-red-500 text-white hover:bg-red-600 transition-all">
                Nedgrader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
