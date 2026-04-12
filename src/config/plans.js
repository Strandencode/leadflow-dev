/**
 * LeadFlow Pricing Plans
 *
 * No free tier — all plans start with 14-day free trial.
 * After trial expires, user must subscribe to continue.
 */

export const PLANS = {
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 199,
    priceLabel: '199 kr',
    period: '/mnd',
    icon: '👑',
    color: '#FF6B4A',
    popular: true,
    trialDays: 14,
    limits: {
      enrichments: 200,       // 200 enrichments/month
      visibleResults: Infinity,
      savedLists: 10,
      pipelineLeads: Infinity,
      emailTemplates: true,
      csvExport: true,
      analytics: true,
      workspace: false,
      maxUsers: 1,
    },
    features: [
      '200 enrichments/mnd (kontakt + regnskap)',
      'Alle søkeresultater',
      '10 lagrede lister',
      'Ubegrenset pipeline',
      'E-postmaler + send',
      'CSV-eksport',
      'Analytics dashboard',
    ],
    missing: [
      'Ubegrenset enrichment',
      'Workspace / team',
    ],
    cta: 'Start 14 dagers gratis prøveperiode',
    ctaStyle: 'bg-coral text-white hover:bg-coral-hover',
  },

  business: {
    id: 'business',
    name: 'Business',
    price: 499,
    priceLabel: '499 kr',
    period: '/mnd',
    icon: '🚀',
    color: '#7C5CFC',
    trialDays: 14,
    limits: {
      enrichments: Infinity,
      visibleResults: Infinity,
      savedLists: Infinity,
      pipelineLeads: Infinity,
      emailTemplates: true,
      csvExport: true,
      analytics: true,
      workspace: true,
      maxUsers: 5,
    },
    features: [
      'Ubegrenset enrichment',
      'Alle søkeresultater',
      'Ubegrenset lagrede lister',
      'Ubegrenset pipeline',
      'E-postmaler + send',
      'CSV-eksport med regnskap',
      'Avansert analytics',
      'Workspace — opptil 5 brukere',
      'Delte lister og pipeline',
    ],
    missing: [],
    cta: 'Start 14 dagers gratis prøveperiode',
    ctaStyle: 'bg-violet text-white hover:bg-[#6A4AE8]',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    period: '',
    icon: '💎',
    color: '#22C55E',
    trialDays: 0,
    limits: {
      enrichments: Infinity,
      visibleResults: Infinity,
      savedLists: Infinity,
      pipelineLeads: Infinity,
      emailTemplates: true,
      csvExport: true,
      analytics: true,
      workspace: true,
      maxUsers: Infinity,
    },
    features: [
      'Alt i Business',
      'Ubegrenset brukere',
      'Tilpassede bransjemaler',
      'API-tilgang',
      'Dedikert onboarding',
      'SSO & SAML',
      'Prioritert support',
    ],
    missing: [],
    cta: 'Kontakt oss',
    ctaStyle: 'border border-green-500/30 text-green-400 hover:bg-green-500/10',
  },
}

export const PLAN_ORDER = ['professional', 'business', 'enterprise']

export function getPlan(id) {
  return PLANS[id] || PLANS.professional
}

export function getPlanLimits(id) {
  return getPlan(id).limits
}
