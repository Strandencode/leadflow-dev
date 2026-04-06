import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight } from 'lucide-react'

/**
 * Reusable upgrade prompt shown when a feature is gated.
 * Can be inline (small) or overlay (full blurred overlay).
 */
export function UpgradePrompt({ feature, planNeeded = 'Professional', inline = false }) {
  const navigate = useNavigate()

  if (inline) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet/5 to-coral/5 border border-violet/20 rounded-xl">
        <Lock size={16} className="text-violet flex-shrink-0" />
        <div className="flex-1">
          <span className="text-[0.82rem] text-txt-secondary">{feature}</span>
          <span className="text-[0.82rem] text-violet font-medium ml-1">Krever {planNeeded}</span>
        </div>
        <button onClick={() => navigate('/settings')} className="flex items-center gap-1 px-3 py-1.5 bg-violet text-white rounded-lg text-[0.75rem] font-medium hover:bg-violet/90 transition-all">
          Oppgrader <ArrowRight size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[2px]">
      <div className="bg-surface-raised border border-bdr rounded-2xl shadow-xl p-8 max-w-sm text-center mx-4">
        <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-violet" />
        </div>
        <h3 className="font-display text-lg font-semibold mb-2">{feature}</h3>
        <p className="text-[0.85rem] text-txt-secondary mb-5">
          Denne funksjonen krever <strong className="text-violet">{planNeeded}</strong> eller høyere.
        </p>
        <button onClick={() => navigate('/settings')} className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-violet text-white rounded-xl text-[0.88rem] font-semibold hover:bg-violet/90 transition-all">
          Se planer og oppgrader <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * Blurred overlay for gated results.
 * Wraps children and shows upgrade prompt over blurred content.
 */
export function GatedOverlay({ children, feature, planNeeded = 'Professional', locked = false }) {
  if (!locked) return children

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-60">
        {children}
      </div>
      <UpgradePrompt feature={feature} planNeeded={planNeeded} />
    </div>
  )
}
