/**
 * Brønnøysundregistrene (Brreg) API integration
 * + Regnskapsregisteret for revenue/financials
 */

const BRREG_BASE = 'https://data.brreg.no/enhetsregisteret/api'
const REGNSKAP_BASE = 'https://data.brreg.no/regnskapsregisteret/regnskap'

// ============================================
// Company Search
// ============================================
export async function searchCompanies({
  query = '', industrikode = '', kommunenummer = '',
  fraRegistreringsdato = '', tilRegistreringsdato = '',
  fraAntallAnsatte = '', tilAntallAnsatte = '',
  organisasjonsform = '', size = 50, page = 0,
} = {}) {
  const params = new URLSearchParams()
  if (query) params.append('navn', query)
  if (industrikode) params.append('naeringskode', industrikode)
  if (kommunenummer) params.append('kommunenummer', kommunenummer)
  if (fraRegistreringsdato) params.append('fraRegistreringsdatoEnhetsregisteret', fraRegistreringsdato)
  if (tilRegistreringsdato) params.append('tilRegistreringsdatoEnhetsregisteret', tilRegistreringsdato)
  if (fraAntallAnsatte) params.append('fraAntallAnsatte', fraAntallAnsatte)
  if (tilAntallAnsatte) params.append('tilAntallAnsatte', tilAntallAnsatte)
  if (!organisasjonsform) params.append('organisasjonsform', 'AS')
  else params.append('organisasjonsform', organisasjonsform)
  params.append('size', size)
  params.append('page', page)

  const response = await fetch(`${BRREG_BASE}/enheter?${params.toString()}`)
  if (!response.ok) throw new Error(`Brreg API error: ${response.status}`)
  const data = await response.json()

  return {
    companies: (data._embedded?.enheter || []).map(transformCompany),
    totalResults: data.page?.totalElements || 0,
    totalPages: data.page?.totalPages || 0,
    currentPage: page,
  }
}

// ============================================
// Roles (contact person, accountant, auditor)
// ============================================
export async function getCompanyRoles(orgNumber) {
  try {
    const response = await fetch(`${BRREG_BASE}/enheter/${orgNumber}/roller`, { headers: { Accept: 'application/json' } })
    if (!response.ok) return { contact: null, accountant: null, auditor: null, allRoles: [] }
    const data = await response.json()

    let contact = null, accountant = null, auditor = null
    const allRoles = []

    for (const group of data?.rollegrupper || []) {
      const code = group.type?.kode
      for (const role of group?.roller || []) {
        if (role.fratraadt) continue
        if (role.person) {
          const name = `${role.person.navn?.fornavn || ''} ${role.person.navn?.etternavn || ''}`.trim()
          const entry = { name, role: translateRole(code), roleCode: code }
          allRoles.push(entry)
          if (!contact && ['DAGL', 'LEDE', 'STYR'].includes(code)) contact = entry
        }
        if (code === 'REGN' && role.enhet) accountant = role.enhet.navn || 'Registrert'
        if (code === 'REVI' && role.enhet) auditor = role.enhet.navn || 'Registrert'
      }
    }
    if (!contact && allRoles.length) contact = allRoles[0]

    return { contact, accountant, auditor, allRoles }
  } catch {
    return { contact: null, accountant: null, auditor: null, allRoles: [] }
  }
}

// ============================================
// Accounting data (revenue, profit etc.)
// ============================================
export async function getCompanyAccounting(orgNumber) {
  try {
    const response = await fetch(`${REGNSKAP_BASE}/${orgNumber}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const data = await response.json()
    // API returns array, first entry is most recent
    const latest = Array.isArray(data) ? data[0] : data
    if (!latest) return null

    const drift = latest.resultatregnskapResultat?.driftsresultat
    const resultat = latest.resultatregnskapResultat
    const ek = latest.egenkapitalGjeld

    return {
      year: latest.regnskapsperiode?.tilDato?.slice(0, 4) || '',
      revenue: drift?.driftsinntekter?.sumDriftsinntekter ?? null,
      operatingProfit: drift?.driftsresultat ?? null,
      netProfit: resultat?.aarsresultat ?? null,
      equity: ek?.egenkapital?.sumEgenkapital ?? null,
      totalAssets: ek?.sumEgenkapitalGjeld ?? null,
      operatingCosts: drift?.driftskostnad?.sumDriftskostnad ?? null,
    }
  } catch {
    return null
  }
}

// ============================================
// Phase 1: Fetch ALL companies (basic data only) for aggregate counts
// Brreg allows max 100 per page, so we paginate through all
// ============================================
export async function fetchAllBasic(filters) {
  const {
    query = '', industrikode = '', kommunenummer = '',
    fraRegistreringsdato = '', tilRegistreringsdato = '',
    fraAntallAnsatte = '', tilAntallAnsatte = '',
    organisasjonsform = '', dateType = 'registrering',
  } = filters

  const baseParams = new URLSearchParams()
  if (query) baseParams.append('navn', query)
  if (industrikode) baseParams.append('naeringskode', industrikode)
  if (kommunenummer) baseParams.append('kommunenummer', kommunenummer)
  if (fraRegistreringsdato) {
    if (dateType === 'stiftelse') baseParams.append('fraStiftelsesdato', fraRegistreringsdato)
    else baseParams.append('fraRegistreringsdatoEnhetsregisteret', fraRegistreringsdato)
  }
  if (tilRegistreringsdato) {
    if (dateType === 'stiftelse') baseParams.append('tilStiftelsesdato', tilRegistreringsdato)
    else baseParams.append('tilRegistreringsdatoEnhetsregisteret', tilRegistreringsdato)
  }
  if (fraAntallAnsatte) baseParams.append('fraAntallAnsatte', fraAntallAnsatte)
  if (tilAntallAnsatte) baseParams.append('tilAntallAnsatte', tilAntallAnsatte)
  if (!organisasjonsform) baseParams.append('organisasjonsform', 'AS')
  else baseParams.append('organisasjonsform', organisasjonsform)

  let allCompanies = []
  let page = 0
  let totalPages = 1
  let totalResults = 0

  // Fetch all pages (max 100 per page for speed)
  while (page < totalPages && page < 50) { // Cap at 5000 companies max
    const params = new URLSearchParams(baseParams)
    params.append('size', '100')
    params.append('page', page.toString())

    const response = await fetch(`${BRREG_BASE}/enheter?${params.toString()}`)
    if (!response.ok) break
    const data = await response.json()

    const companies = (data._embedded?.enheter || []).map(transformCompany)
    allCompanies.push(...companies)

    totalPages = data.page?.totalPages || 1
    totalResults = data.page?.totalElements || 0
    page++
  }

  return {
    allCompanies,
    totalResults,
    stats: {
      total: allCompanies.length,
      withEmail: allCompanies.filter(c => c.email).length,
      withPhone: allCompanies.filter(c => c.phone).length,
      withAny: allCompanies.filter(c => c.email || c.phone).length,
    }
  }
}

// ============================================
// Phase 2: Enrich a page of companies with roles + accounting
// ============================================
export async function enrichCompanies(companies) {
  const batchSize = 10
  const enriched = []

  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(async (company) => {
        const [roles, accounting] = await Promise.all([
          getCompanyRoles(company.orgNumber),
          getCompanyAccounting(company.orgNumber),
        ])
        return {
          ...company,
          contactName: roles.contact?.name || '—',
          contactRole: roles.contact?.role || '—',
          accountant: roles.accountant || '',
          auditor: roles.auditor || '',
          allRoles: roles.allRoles || [],
          revenue: accounting?.revenue ?? null,
          revenueYear: accounting?.year || '',
          operatingProfit: accounting?.operatingProfit ?? null,
          netProfit: accounting?.netProfit ?? null,
          equity: accounting?.equity ?? null,
          totalAssets: accounting?.totalAssets ?? null,
        }
      })
    )
    enriched.push(...batchResults)
  }
  return enriched
}

// Legacy wrapper for compatibility
export async function searchAndEnrich(filters) {
  const result = await searchCompanies(filters)
  const enriched = await enrichCompanies(result.companies)
  return { ...result, companies: enriched }
}

// ============================================
// Helpers
// ============================================
function transformCompany(raw) {
  const nace = raw.naeringskode1
  const address = raw.forretningsadresse || raw.postadresse || {}
  const capital = raw.kapital

  return {
    orgNumber: raw.organisasjonsnummer,
    name: raw.navn,
    organizationForm: raw.organisasjonsform?.kode || '',
    industry: nace?.beskrivelse || 'Ukjent',
    industryCode: nace?.kode || '',
    address: [
      ...(address.adresse || []),
      `${address.postnummer || ''} ${address.poststed || ''}`.trim(),
    ].filter(Boolean).join(', '),
    postCode: address.postnummer || '',
    city: address.poststed || '',
    municipality: address.kommune || '',
    municipalityNumber: address.kommunenummer || '',
    employees: raw.antallAnsatte ?? null,
    registrationDate: raw.registreringsdatoEnhetsregisteret || '',
    foundedDate: raw.stiftelsesdato || raw.registreringsdatoEnhetsregisteret || '',
    website: raw.hjemmeside || '',
    email: raw.epostadresse || '',
    phone: raw.telefon || raw.mobil || '',
    purpose: (raw.vedtektsfestetFormaal || []).join(' ') || (raw.aktivitet || []).join(' ') || '',
    shareCapital: capital ? Math.round(capital.belop || 0) : null,
    shareCount: capital?.antallAksjer ?? null,
    noAudit: !!raw.fravalgRevisjonDato,
    // Enriched later
    contactName: null, contactRole: null,
    accountant: '', auditor: '', allRoles: [],
    revenue: null, revenueYear: '',
    operatingProfit: null, netProfit: null, equity: null, totalAssets: null,
  }
}

function translateRole(code) {
  const map = {
    DAGL: 'Daglig leder', LEDE: 'Styreleder', STYR: 'Styremedlem',
    NEST: 'Nestleder', REPR: 'Representant', REVI: 'Revisor',
    REGN: 'Regnskapsfører', KONT: 'Kontaktperson',
  }
  return map[code] || code || 'Ukjent rolle'
}

export function formatNOK(amount) {
  if (amount == null) return '—'
  if (Math.abs(amount) >= 1e9) return `${(amount / 1e9).toFixed(1)} mrd`
  if (Math.abs(amount) >= 1e6) return `${(amount / 1e6).toFixed(1)} M`
  if (Math.abs(amount) >= 1e3) return `${(amount / 1e3).toFixed(0)} K`
  return amount.toLocaleString('nb-NO')
}

// Municipality numbers
export const MUNICIPALITIES = [
  { value: '', label: 'Hele Norge' },
  { value: '0301', label: 'Oslo' },
  { value: '4601', label: 'Bergen' },
  { value: '5001', label: 'Trondheim' },
  { value: '1103', label: 'Stavanger' },
  { value: '5401', label: 'Tromsø' },
  { value: '4204', label: 'Kristiansand' },
  { value: '3005', label: 'Drammen' },
  { value: '3301', label: 'Fredrikstad' },
  { value: '1505', label: 'Kristiansund' },
  { value: '1804', label: 'Bodø' },
]

// Common NACE codes
export const NACE_CODES = [
  { value: '', label: 'Alle bransjer' },
  { value: '62', label: '62 — IT og programvare' },
  { value: '41', label: '41 — Bygg og anlegg' },
  { value: '46', label: '46 — Engroshandel' },
  { value: '47', label: '47 — Detaljhandel' },
  { value: '56', label: '56 — Servering' },
  { value: '68', label: '68 — Eiendom' },
  { value: '69', label: '69 — Regnskap og juss' },
  { value: '70', label: '70 — Rådgivning' },
  { value: '73', label: '73 — Reklame og markedsføring' },
  { value: '86', label: '86 — Helse' },
  { value: '85', label: '85 — Utdanning' },
  { value: '10', label: '10 — Næringsmidler' },
  { value: '25', label: '25 — Metallvarer' },
  { value: '43', label: '43 — Spesialisert bygg' },
  { value: '49', label: '49 — Transport' },
  { value: '64', label: '64 — Finans' },
  { value: '71', label: '71 — Arkitekter og ingeniører' },
  { value: '74', label: '74 — Design og foto' },
  { value: '82', label: '82 — Kontortjenester' },
  { value: '47.11', label: '47.11 — Dagligvare' },
  { value: '47.270', label: '47.270 — Helsekost og naturkost' },
  { value: '47.64', label: '47.64 — Sport og fritidsutstyr' },
  { value: '47.73', label: '47.73 — Apotek' },
  { value: '47.76', label: '47.76 — Dyrebutikker og blomster' },
  { value: '55.10', label: '55.10 — Hotell' },
  { value: '75', label: '75 — Veterinærtjenester' },
  { value: '87', label: '87 — Pleie og omsorg' },
  { value: '88.91', label: '88.91 — Barnehager' },
  { value: '96.210', label: '96.210 — Frisørsalonger (3 200+)' },
  { value: '96.220', label: '96.220 — Skjønnhetspleie og fotpleie (1 000+)' },
  { value: '96.230', label: '96.230 — Spa og dagspa (600+)' },
  { value: '86.991', label: '86.991 — Fotterapi og ortopedi (230+)' },
  { value: '96', label: '96 — Alle personlige tjenester (6 000+)' },
]

export const EMPLOYEE_RANGES = [
  { value: '', fromVal: '', toVal: '', label: 'Alle størrelser' },
  { value: '1-10', fromVal: '1', toVal: '10', label: '1–10 ansatte' },
  { value: '11-50', fromVal: '11', toVal: '50', label: '11–50 ansatte' },
  { value: '51-200', fromVal: '51', toVal: '200', label: '51–200 ansatte' },
  { value: '200+', fromVal: '200', toVal: '', label: '200+ ansatte' },
]
