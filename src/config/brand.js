/**
 * Central brand configuration.
 *
 * All user-facing references to the brand name, tagline, domain, and
 * contact info should read from BRAND. When the name, domain, or logo
 * changes, update this file and (for logos) the files in /public/brand/.
 *
 *   import { BRAND } from '../config/brand'
 *   <h1>Velkommen til {BRAND.name}</h1>
 *
 * The <Logo /> and <Mark /> components in src/components/Logo.jsx are
 * the single source of truth for visual identity — they point at SVGs
 * in /public/brand/ so swapping assets doesn't require code changes.
 */
export const BRAND = {
  // Core identity
  name:       'Vekstor',
  nameLower:  'vekstor',
  tagline:    'Growth Intelligence',
  descriptor: 'Norsk B2B-plattform',

  // Domains
  domain:    'vekstor.no',
  appDomain: 'app.vekstor.no',
  appUrl:    'https://app.vekstor.no',
  siteUrl:   'https://vekstor.no',

  // Contact
  email: {
    contact: 'hei@vekstor.no',
    support: 'kontakt@vekstor.no',
    demo:    'demo@vekstor.no',
  },

  // Legal / footer
  legal: {
    companyName: 'Vekstor AS',
    orgNumber:   '999 888 777',
    address:     'Oslo, Norge',
  },

  // Internal — localStorage keys stay prefixed with the legacy value
  // so existing users don't lose their saved state on rebrand.
  // New keys should prefer `storagePrefix` over hardcoded strings.
  storagePrefix: 'leadflow',
}

/** Build a namespaced localStorage key. */
export const storageKey = (suffix) => `${BRAND.storagePrefix}_${suffix}`

export default BRAND
