import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Target, Search, Bookmark, ArrowRight, Check, Sparkles } from 'lucide-react'

const STEPS = [
  {
    icon: Target,
    title: 'Fyll ut ICP-profilen din',
    description: 'Fortell oss om bedriften din og hvem du onsker a na. Dette hjelper oss a finne de rette kundene og generere bedre e-postmaler.',
    action: 'Ga til ICP Builder',
    path: '/icp',
    color: '#7C5CFC',
  },
  {
    icon: Search,
    title: 'Sok etter leads',
    description: 'Bla gjennom hele Bronnoysundregistrene. Filtrer pa bransje, kommune, storrelse og mer. Vi finner kontaktpersoner og okonomi automatisk.',
    action: 'Start forste sok',
    path: '/search',
    color: '#FF6B4A',
  },
  {
    icon: Bookmark,
    title: 'Lagre og kontakt',
    description: 'Lagre de beste leadene i en liste, send e-post med maler, og spor hvem du har kontaktet. Alt pa ett sted.',
    action: 'Se lagrede lister',
    path: '/saved',
    color: '#2DD4BF',
  },
]

export default function OnboardingWizard({ onDismiss }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const step = STEPS[currentStep]
  const Icon = step.icon

  function handleAction() {
    onDismiss()
    navigate(step.path)
  }

  function handleNext() {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1)
    else onDismiss()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-scale-in" onClick={onDismiss}>
      <div className="bg-surface-raised rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-8 pb-6 text-center"
          style={{ background: `linear-gradient(135deg, ${step.color}08, ${step.color}04)` }}>
          <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-sunken text-txt-tertiary transition-all">
            <X size={18} />
          </button>

          <div className="flex items-center justify-center gap-1.5 mb-6">
            <Sparkles size={14} className="text-coral" />
            <span className="text-[0.78rem] font-semibold text-txt-secondary">Velkommen til LeadFlow</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.78rem] font-bold transition-all duration-300 ${
                  i < currentStep ? 'bg-green-500 text-white' :
                  i === currentStep ? 'text-white' : 'bg-surface-sunken text-txt-tertiary'
                }`}
                style={i === currentStep ? { background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` } : {}}>
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full transition-all ${i < currentStep ? 'bg-green-400' : 'bg-surface-sunken'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
            <Icon size={28} className="text-white" />
          </div>

          <h2 className="font-display text-xl font-bold mb-2">{step.title}</h2>
          <p className="text-txt-secondary text-[0.9rem] leading-relaxed max-w-sm mx-auto">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 pt-4">
          <button onClick={handleAction}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[0.9rem] font-semibold text-white mb-3 hover:-translate-y-0.5 hover:shadow-lg transition-all"
            style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}cc)` }}>
            {step.action}
            <ArrowRight size={16} />
          </button>

          <div className="flex items-center justify-between">
            <button onClick={onDismiss} className="text-[0.82rem] text-txt-tertiary hover:text-txt-secondary transition-colors">
              Hopp over
            </button>
            {currentStep < STEPS.length - 1 && (
              <button onClick={handleNext} className="text-[0.82rem] text-txt-secondary hover:text-txt-primary font-medium transition-colors">
                Neste steg →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
