import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Target, Search, Bookmark, ArrowRight, Check, Sparkles, ChevronRight } from 'lucide-react'
import TEMPLATES, { applyTemplate } from '../config/templates'

export default function OnboardingWizard({ onDismiss }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('template') // 'template' | 'guide'
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [guideStep, setGuideStep] = useState(0)

  const GUIDE_STEPS = [
    {
      icon: Target,
      title: 'Se over ICP-profilen din',
      description: selectedTemplate
        ? `Vi har fylt ut profilen basert på "${selectedTemplate.name}"-malen. Gå inn og juster om nødvendig.`
        : 'Fortell oss om bedriften din og hvem du ønsker å nå.',
      action: 'Gå til ICP',
      path: '/icp',
      color: '#0051A8',
    },
    {
      icon: Search,
      title: 'Søk etter leads',
      description: selectedTemplate && selectedTemplate.suggestedSearches.length > 0
        ? `Vi har lagt inn ${selectedTemplate.suggestedSearches.length} forhåndsdefinerte søk tilpasset din bransje. Klikk og gå!`
        : 'Bruk Brønnøysundregistrene til å finne bedrifter som matcher din ICP.',
      action: 'Start prospektering',
      path: '/search',
      color: '#3B82F6',
    },
    {
      icon: Bookmark,
      title: 'Lagre og ta kontakt',
      description: 'Lagre de beste leadene i en liste, send e-post med ferdiglagde maler, og spor hvem du har kontaktet.',
      action: 'Se lagrede lister',
      path: '/saved',
      color: '#10B981',
    },
  ]

  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
  }

  function handleConfirmTemplate() {
    if (selectedTemplate && selectedTemplate.id !== 'general') {
      applyTemplate(selectedTemplate.id)
    }
    setStep('guide')
  }

  function handleSkipTemplate() {
    setStep('guide')
  }

  function handleGuideAction() {
    onDismiss()
    navigate(GUIDE_STEPS[guideStep].path)
  }

  function handleGuideNext() {
    if (guideStep < GUIDE_STEPS.length - 1) setGuideStep(guideStep + 1)
    else onDismiss()
  }

  const businessTemplates = TEMPLATES.filter(t => t.id !== 'general')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-scale-in" onClick={onDismiss}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

        {step === 'template' ? (
          <>
            {/* Template selection */}
            <div className="relative p-8 pb-6 text-center border-b border-gray-100">
              <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded hover:bg-gray-100 text-txt-tertiary transition-all">
                <X size={18} />
              </button>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={15} className="text-gold" />
                <span className="text-[0.78rem] font-medium text-txt-secondary tracking-wide">Velkommen til LeadFlow</span>
              </div>
              <h2 className="font-display text-[1.4rem] mb-2 text-ink">Velg din bransjemal</h2>
              <p className="text-txt-tertiary text-[0.85rem] font-light max-w-sm mx-auto">
                Vi fyller ut ICP, søkekategorier og e-postmaler automatisk basert på din bransje.
              </p>
            </div>

            <div className="p-6 space-y-2">
              {businessTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                    selectedTemplate?.id === t.id
                      ? 'border-gold bg-gold/[0.04] shadow-sm'
                      : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl"
                    style={{ background: `${t.color}10` }}>
                    {t.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.88rem] font-medium text-ink">{t.name}</div>
                    <div className="text-[0.78rem] text-txt-tertiary font-light truncate">{t.description}</div>
                  </div>
                  {selectedTemplate?.id === t.id && (
                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 flex items-center justify-between">
              <button onClick={handleSkipTemplate} className="text-[0.82rem] text-txt-tertiary hover:text-txt-secondary transition-colors font-light">
                Start uten mal
              </button>
              <button
                onClick={handleConfirmTemplate}
                disabled={!selectedTemplate}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-[0.85rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Bruk denne malen
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Guide steps */}
            <div className="relative p-8 pb-6 text-center">
              <button onClick={onDismiss} className="absolute top-4 right-4 p-1.5 rounded hover:bg-gray-100 text-txt-tertiary transition-all">
                <X size={18} />
              </button>

              {selectedTemplate && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/[0.06] border border-gold/10 mb-4">
                  <span className="text-sm">{selectedTemplate.icon}</span>
                  <span className="text-[0.72rem] text-gold font-medium">{selectedTemplate.name}-malen er aktivert</span>
                </div>
              )}

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {GUIDE_STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.72rem] font-medium transition-all ${
                      i < guideStep ? 'bg-emerald-500 text-white' :
                      i === guideStep ? 'text-white' : 'bg-gray-100 text-txt-tertiary'
                    }`}
                    style={i === guideStep ? { background: GUIDE_STEPS[i].color } : {}}>
                      {i < guideStep ? <Check size={13} /> : i + 1}
                    </div>
                    {i < GUIDE_STEPS.length - 1 && (
                      <div className={`w-8 h-px ${i < guideStep ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              {(() => {
                const gs = GUIDE_STEPS[guideStep]
                const Icon = gs.icon
                return (
                  <>
                    <div className="w-14 h-14 rounded-lg mx-auto mb-5 flex items-center justify-center"
                      style={{ background: `${gs.color}12` }}>
                      <Icon size={24} style={{ color: gs.color }} />
                    </div>
                    <h2 className="font-display text-[1.2rem] mb-2 text-ink">{gs.title}</h2>
                    <p className="text-txt-tertiary text-[0.85rem] font-light leading-relaxed max-w-sm mx-auto">{gs.description}</p>
                  </>
                )
              })()}
            </div>

            <div className="px-8 pb-8 pt-2">
              <button onClick={handleGuideAction}
                className="w-full flex items-center justify-center gap-2 py-3 rounded text-[0.88rem] font-medium text-ink bg-gold hover:bg-gold-light transition-all mb-3"
              >
                {GUIDE_STEPS[guideStep].action}
                <ArrowRight size={15} />
              </button>
              <div className="flex items-center justify-between">
                <button onClick={onDismiss} className="text-[0.82rem] text-txt-tertiary hover:text-txt-secondary transition-colors font-light">
                  Hopp over
                </button>
                {guideStep < GUIDE_STEPS.length - 1 && (
                  <button onClick={handleGuideNext} className="text-[0.82rem] text-txt-secondary hover:text-ink font-medium transition-colors">
                    Neste steg
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
