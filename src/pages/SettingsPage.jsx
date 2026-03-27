import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSavedLists } from '../hooks/useSavedLists'
import { useUsage } from '../hooks/useUsage'
import toast from 'react-hot-toast'
import { Crown, Zap, Rocket } from 'lucide-react'

const PLAN_KEY = 'leadflow_user_plan'

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0',
    priceLabel: 'Gratis',
    icon: Zap,
    color: 'border-bdr',
    btnClass: 'border border-bdr text-txt-secondary hover:bg-surface-sunken',
    btnText: 'Nåværende plan',
    limits: { emails: 20, phones: 20 },
    features: ['20 e-poster sendt/mnd', '20 telefonnumre funnet/mnd', 'Ubegrenset søk', 'ICP-profil', 'E-postmaler'],
    missing: ['AI e-postgenerering', 'Kundesegment-maler', 'Prioritert support'],
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '49',
    priceLabel: '49 kr',
    icon: Crown,
    color: 'border-coral',
    btnClass: 'bg-coral text-white hover:bg-coral-hover',
    btnText: 'Oppgrader',
    limits: { emails: 1000, phones: 1000 },
    features: ['1 000 e-poster sendt/mnd', '1 000 telefonnumre funnet/mnd', 'Ubegrenset søk', 'ICP-profil', 'AI e-postgenerering', 'Alle kundesegment-maler'],
    missing: ['Prioritert support'],
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '149',
    priceLabel: '149 kr',
    icon: Rocket,
    color: 'border-violet',
    btnClass: 'bg-violet text-white hover:bg-[#6A4AE8]',
    btnText: 'Oppgrader',
    limits: { emails: Infinity, phones: Infinity },
    features: ['Alt ubegrenset', 'Ubegrenset e-poster', 'Ubegrenset telefonnumre', 'AI e-postgenerering', 'Alle kundesegment-maler', 'Prioritert support', 'Tidlig tilgang til nye funksjoner'],
    missing: [],
    popular: false,
  },
]

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const { getStats } = useSavedLists()
  const stats = useMemo(() => getStats(), [getStats])
  const usageData = useUsage()

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [company, setCompany] = useState(profile?.company_name || user?.user_metadata?.company_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [cancelledAt, setCancelledAt] = useState(null) // ISO date when cancelled
  const [planExpiresAt, setPlanExpiresAt] = useState(null) // ISO date when plan expires
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAN_KEY)
      if (stored) setCurrentPlan(stored)
      const cancelled = localStorage.getItem('leadflow_cancelled_at')
      if (cancelled) setCancelledAt(cancelled)
      const expires = localStorage.getItem('leadflow_plan_expires')
      if (expires) setPlanExpiresAt(expires)

      // Check if plan has expired
      if (expires && new Date(expires) < new Date()) {
        setCurrentPlan('free')
        localStorage.setItem(PLAN_KEY, 'free')
        localStorage.removeItem('leadflow_cancelled_at')
        localStorage.removeItem('leadflow_plan_expires')
        setCancelledAt(null)
        setPlanExpiresAt(null)
      }
    } catch {}
  }, [])

  function handleSaveProfile() {
    toast.success('Profil oppdatert!')
  }

  function handleSelectPlan(planId) {
    if (planId === currentPlan && !cancelledAt) return
    if (planId === 'free') {
      setShowDowngradeModal(true)
      return
    }

    const stripeLinks = {
      starter: 'https://buy.stripe.com/test_7sY8wIgelgpl1pjcWuak001',
      unlimited: 'https://buy.stripe.com/test_eVq7sEbY53Cz8RL6y6ak002',
    }

    const url = stripeLinks[planId]
    if (url) {
      setCancelledAt(null)
      setPlanExpiresAt(null)
      localStorage.removeItem('leadflow_cancelled_at')
      localStorage.removeItem('leadflow_plan_expires')
      setCurrentPlan(planId)
      localStorage.setItem(PLAN_KEY, planId)
      window.open(url, '_blank')
      toast.success('Stripe Checkout åpnet i ny fane')
    }
  }

  function handleCancelSubscription() {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    setCancelledAt(now.toISOString())
    setPlanExpiresAt(endOfMonth.toISOString())
    localStorage.setItem('leadflow_cancelled_at', now.toISOString())
    localStorage.setItem('leadflow_plan_expires', endOfMonth.toISOString())
    setShowCancelModal(false)
    toast.success(`Kansellert. Du beholder ${activePlan.name}-tilgang til ${endOfMonth.toLocaleDateString('nb-NO')}.`)
  }

  function handleDowngradeToFree() {
    const now = new Date()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    setCancelledAt(now.toISOString())
    setPlanExpiresAt(endOfMonth.toISOString())
    localStorage.setItem('leadflow_cancelled_at', now.toISOString())
    localStorage.setItem('leadflow_plan_expires', endOfMonth.toISOString())
    setShowDowngradeModal(false)
    toast.success(`Nedgradert. ${activePlan.name}-tilgang til ${endOfMonth.toLocaleDateString('nb-NO')}.`)
  }

  function handleReactivate() {
    setCancelledAt(null)
    setPlanExpiresAt(null)
    localStorage.removeItem('leadflow_cancelled_at')
    localStorage.removeItem('leadflow_plan_expires')
    toast.success('Abonnementet er reaktivert!')
  }

  const activePlan = PLANS.find(p => p.id === currentPlan) || PLANS[0]
  const emailUsage = usageData.emailsUsed
  const phoneUsage = usageData.phonesUsed
  const emailLimit = activePlan.limits.emails
  const phoneLimit = activePlan.limits.phones
  const emailPct = emailLimit === Infinity ? 0 : Math.min(100, Math.round((emailUsage / emailLimit) * 100))
  const phonePct = phoneLimit === Infinity ? 0 : Math.min(100, Math.round((phoneUsage / phoneLimit) * 100))

  return (
    <div>
      <div className="px-8 py-6 bg-surface-raised border-b border-bdr sticky top-0 z-40">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Innstillinger</h1>
        <p className="text-txt-secondary text-[0.9rem] mt-0.5">Administrer konto og abonnement</p>
      </div>

      <div className="p-8 max-w-[780px]">
        {/* Current plan + usage */}
        <div className="animate-in delay-1 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
          <h3 className="font-display text-lg font-semibold mb-6">Abonnement</h3>

          <div className="flex justify-between items-center py-4 border-b border-surface-sunken">
            <div>
              <h4 className="text-[0.92rem] font-medium">Gjeldende plan</h4>
              <p className="text-[0.82rem] text-txt-secondary mt-0.5">
                {activePlan.name} — {activePlan.limits.emails === Infinity ? 'Alt ubegrenset' : `${activePlan.limits.emails} e-poster & ${activePlan.limits.phones} telefonnumre per mnd`}
              </p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-[0.82rem] font-semibold ${
              currentPlan === 'unlimited' ? 'bg-violet-soft text-violet' :
              currentPlan === 'starter' ? 'bg-coral-glow text-coral' :
              'bg-surface-sunken text-txt-secondary'
            }`}>
              {activePlan.name}
            </span>
          </div>

          {/* Usage bars */}
          <div className="py-4 border-b border-surface-sunken space-y-3">
            <div>
              <div className="flex justify-between text-[0.82rem] mb-1.5">
                <span className="text-txt-secondary">E-poster sendt</span>
                <span className="font-medium">{emailUsage} / {emailLimit === Infinity ? '∞' : emailLimit}</span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${emailPct > 80 ? 'bg-red-500' : 'bg-coral'}`} style={{ width: emailLimit === Infinity ? '2%' : `${emailPct}%` }} />
              </div>
              {emailPct > 80 && emailLimit !== Infinity && (
                <p className="text-[0.75rem] text-red-500 mt-1">Nærmer seg grensen — vurder å oppgradere</p>
              )}
            </div>
            <div>
              <div className="flex justify-between text-[0.82rem] mb-1.5">
                <span className="text-txt-secondary">Telefonnumre funnet</span>
                <span className="font-medium">{phoneUsage} / {phoneLimit === Infinity ? '∞' : phoneLimit}</span>
              </div>
              <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${phonePct > 80 ? 'bg-red-500' : 'bg-teal'}`} style={{ width: phoneLimit === Infinity ? '2%' : `${phonePct}%` }} />
              </div>
            </div>
          </div>

          {currentPlan !== 'free' && (
            <div className="py-4 space-y-4">
              {/* Cancellation banner */}
              {cancelledAt && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[0.88rem] font-semibold text-amber-800">Abonnement kansellert</h4>
                      <p className="text-[0.82rem] text-amber-700 mt-1">
                        Du beholder {activePlan.name}-tilgang til <strong>{planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('nb-NO') : 'slutten av måneden'}</strong>. Etter dette går du automatisk over til Gratis-planen.
                      </p>
                    </div>
                    <button
                      onClick={handleReactivate}
                      className="flex-shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg text-[0.82rem] font-semibold hover:bg-amber-700 transition-all"
                    >
                      Reaktiver
                    </button>
                  </div>
                </div>
              )}

              {/* Billing row */}
              {!cancelledAt && (
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[0.92rem] font-medium">Fakturering</h4>
                    <p className="text-[0.82rem] text-txt-secondary mt-0.5">Neste faktura: 1. april 2026 — {activePlan.priceLabel}/mnd</p>
                  </div>
                </div>
              )}

              {/* Manage subscription actions */}
              {!cancelledAt && (
                <div className="flex items-center gap-3 pt-2 border-t border-surface-sunken">
                  {currentPlan === 'unlimited' && (
                    <button
                      onClick={() => handleSelectPlan('starter')}
                      className="px-4 py-2 rounded-lg text-[0.82rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all"
                    >
                      Nedgrader til Starter (49 kr/mnd)
                    </button>
                  )}
                  {currentPlan === 'starter' && (
                    <button
                      onClick={() => handleSelectPlan('unlimited')}
                      className="px-4 py-2 rounded-lg text-[0.82rem] font-medium bg-violet text-white hover:bg-[#6A4AE8] transition-all"
                    >
                      Oppgrader til Unlimited (149 kr/mnd)
                    </button>
                  )}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 rounded-lg text-[0.82rem] font-medium text-red-400 hover:text-red-500 hover:bg-red-50 transition-all ml-auto"
                  >
                    Kanseller abonnement
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="animate-in delay-2 bg-surface-raised border border-bdr rounded-xl p-8 mb-6">
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

        {/* Pricing plans */}
        <div className="animate-in delay-3 bg-surface-raised border border-bdr rounded-xl p-8">
          <h3 className="font-display text-lg font-semibold mb-2">Prisplaner</h3>
          <p className="text-[0.85rem] text-txt-secondary mb-6">Velg planen som passer din bedrift</p>

          <div className="grid grid-cols-3 gap-5">
            {PLANS.map(plan => {
              const Icon = plan.icon
              const isCurrent = currentPlan === plan.id
              return (
                <div key={plan.id} className={`p-6 rounded-xl text-center relative ${plan.popular ? 'border-2 border-coral' : `border ${isCurrent ? plan.color : 'border-bdr'}`}`}>
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-coral text-white text-[0.68rem] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      Mest populær
                    </div>
                  )}

                  <Icon size={24} className={`mx-auto mb-2 ${
                    plan.id === 'unlimited' ? 'text-violet' : plan.id === 'starter' ? 'text-coral' : 'text-txt-tertiary'
                  }`} />

                  <div className="text-[0.78rem] uppercase tracking-wider text-txt-tertiary font-semibold">{plan.name}</div>

                  {plan.price === '0' ? (
                    <div className="font-display text-3xl font-bold mt-2">Gratis</div>
                  ) : (
                    <>
                      <div className="font-display text-3xl font-bold mt-2">{plan.price} <span className="text-lg font-medium text-txt-secondary">kr</span></div>
                      <div className="text-[0.82rem] text-txt-secondary">/måned</div>
                    </>
                  )}

                  <div className="text-[0.82rem] text-txt-secondary text-left mt-5 space-y-1.5">
                    {plan.features.map(f => (
                      <div key={f} className="flex items-start gap-2 py-0.5">
                        <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    {plan.missing.map(f => (
                      <div key={f} className="flex items-start gap-2 py-0.5 text-txt-tertiary">
                        <span className="mt-0.5 flex-shrink-0">✗</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent}
                    className={`w-full mt-5 py-2.5 rounded-lg text-[0.85rem] font-semibold transition-all ${
                      isCurrent
                        ? 'bg-surface-sunken text-txt-tertiary cursor-default'
                        : plan.btnClass
                    }`}
                  >
                    {isCurrent ? '✓ Nåværende plan' : plan.btnText}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-surface rounded-xl text-center">
            <p className="text-[0.82rem] text-txt-secondary">
              Alle planer inkluderer ubegrenset søk i Brønnøysundregistrene, ICP-profil og lagrede lister.
              <br />
              <span className="text-txt-tertiary">Betaling håndteres sikkert via Stripe. Kanseller når som helst — du beholder tilgang ut måneden.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
          <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold mb-2">Kanseller abonnement?</h3>
            <p className="text-[0.88rem] text-txt-secondary mb-6">
              Du kan kansellere når som helst. Du beholder <strong>{activePlan.name}</strong>-tilgang ut inneværende måned ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('nb-NO')}), og går deretter over til Gratis-planen.
            </p>

            <div className="p-4 bg-surface rounded-xl mb-6">
              <h4 className="text-[0.82rem] font-semibold mb-2">Du mister tilgang til:</h4>
              <div className="text-[0.82rem] text-txt-secondary space-y-1">
                {currentPlan === 'unlimited' && <div>• Ubegrensede e-poster og telefonnumre</div>}
                {currentPlan === 'starter' && <div>• 1 000 e-poster og telefonnumre per mnd</div>}
                <div>• AI e-postgenerering</div>
                <div>• Kundesegment-maler</div>
              </div>
              <p className="text-[0.82rem] text-txt-tertiary mt-3">Med Gratis-planen får du 20 e-poster og 20 telefonnumre per mnd.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCancelModal(false)} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
                Behold abonnement
              </button>
              <button onClick={handleCancelSubscription} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium bg-red-500 text-white hover:bg-red-600 transition-all">
                Kanseller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Downgrade modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowDowngradeModal(false)}>
          <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-semibold mb-2">Nedgrader til Gratis?</h3>
            <p className="text-[0.88rem] text-txt-secondary mb-6">
              Du beholder <strong>{activePlan.name}</strong>-tilgang ut inneværende måned ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('nb-NO')}), og går deretter over til Gratis-planen automatisk.
            </p>

            <div className="p-4 bg-surface rounded-xl mb-6 text-[0.82rem] text-txt-secondary">
              <strong className="text-txt-primary">Gratis-planen inkluderer:</strong>
              <div className="mt-2 space-y-1">
                <div>✓ 20 e-poster sendt per mnd</div>
                <div>✓ 20 telefonnumre funnet per mnd</div>
                <div>✓ Ubegrenset søk og ICP-profil</div>
                <div className="text-txt-tertiary">✗ AI e-postgenerering</div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDowngradeModal(false)} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
                Avbryt
              </button>
              <button onClick={handleDowngradeToFree} className="px-5 py-2.5 rounded-lg text-[0.875rem] font-medium bg-red-500 text-white hover:bg-red-600 transition-all">
                Nedgrader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
