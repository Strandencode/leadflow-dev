/**
 * LeadFlow Pricing Plans
 *
 * Gating strategy:
 * - Enrichment gate: Free sees company name only, paid gets contacts + financials
 * - Results gate: Free sees 10 results, rest blurred
 * - Export gate: No CSV without paid plan
 * - List gate: 1 free list, then pay
 * - Pipeline gate: 10 leads free
 */

export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 0,
    priceLabel: 'Gratis',
    period: '',
    icon: '⚡',
    color: '#9E98B5',
    limits: {
      enrichments: 0,         // No enrichment — sees company name only
      visibleResults: 30,     // Only 30 results shown, rest blurred
      savedLists: 1,          // 1 saved list
      pipelineLeads: 10,      // 10 leads in pipeline
      emailTemplates: true,   // Can view, not copy/send
      csvExport: false,       // No export
      analytics: false,       // No analytics
      workspace: false,       // No team features
      maxUsers: 1,
    },
    features: [
      'Søk i Brønnøysundregistrene',
      'Se 30 resultater per søk',
      '1 lagret liste',
      '10 leads i pipeline',
      'E-postmaler (visning)',
    ],
    missing: [
      'Kontaktinfo og regnskap',
      'Alle søkeresultater',
      'CSV-eksport',
      'Analytics',
      'Workspace / team',
    ],
    cta: 'Kom i gang gratis',
    ctaStyle: 'border border-bdr text-txt-secondary hover:bg-surface-sunken',
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    price: 199,
    priceLabel: '199 kr',
    period: '/mnd',
    icon: '👑',
    color: '#FF6B4A',
    popular: true,
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
    cta: 'Start 14 dagers prøveperiode',
    ctaStyle: 'bg-coral text-white hover:bg-coral-hover',
  },

  business: {
    id: 'business',
    name: 'Business',
    price: 999,
    priceLabel: '999 kr',
    period: '/mnd',
    icon: '🚀',
    color: '#7C5CFC',
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
      'Kundenotater + kontrakter',
    ],
    missing: [],
    cta: 'Start 14 dagers prøveperiode',
    ctaStyle: 'bg-violet text-white hover:bg-[#6A4AE8]',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    priceLabel: '4 999 kr',
    period: '/mnd',
    icon: '💎',
    color: '#22C55E',
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

export const PLAN_ORDER = ['starter', 'professional', 'business', 'enterprise']

export function getPlan(id) {
  return PLANS[id] || PLANS.starter
}

export function getPlanLimits(id) {
  return getPlan(id).limits
}
