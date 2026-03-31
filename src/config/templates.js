/**
 * LeadFlow Business Templates
 *
 * Each template pre-fills ICP, suggested searches (NACE codes),
 * and email templates for a specific business type.
 *
 * To add a new template: copy an existing one and adjust the fields.
 */

const TEMPLATES = [
  {
    id: 'general',
    name: 'Generell',
    description: 'Start fra scratch — definer alt selv',
    icon: '🔧',
    color: '#8A8A9A',
    icp: {},
    suggestedSearches: [],
    emailSegments: [],
  },
  {
    id: 'optima',
    name: 'Optima Produkter',
    description: 'Naturlig hudpleie for dyr og mennesker — selger til butikker, klinikker og salonger',
    icon: '🧴',
    color: '#7C5CFC',
    icp: {
      companyName: 'Optima Produkter AS',
      yourIndustry: 'Helse',
      whatYouSell: 'Naturlig hudpleieserie basert på pH4-teknologi — uten parabener og kjemikalier. For dyr og mennesker.',
      targetIndustries: 'Dyrebutikker, veterinærklinikker, frisører, spa, apotek, helsekost',
      companySize: '1–10 ansatte',
      targetRegion: '',
      problemYouSolve: 'Vi hjelper butikker og klinikker med å tilby dokumentert, naturlig hudpleie som kundene etterspør — uten skadelige kjemikalier.',
      decisionMakerTitle: 'Daglig leder, Innkjøpsansvarlig',
      decisionMakerDept: 'Ledelse / Executive',
    },
    suggestedSearches: [
      { id: 'dyrebutikker', emoji: '🐕', name: 'Dyrebutikker', description: 'Butikker som selger kjæledyrutstyr og fôr',
        filters: { industrikode: '47.76', kommunenummer: '', employeeRange: '' }, color: 'from-amber-500 to-orange-500',
        include: /dyr|kjæledyr|hund|katt|fôr|pet|zoo|akvar|reptil|fugl|gnager|valp/i,
        exclude: /blomst|flora|florist|interflora|gartn|plante|hage.?sent|bukett|grønt/i },
      { id: 'veterinarer', emoji: '🏥', name: 'Veterinærklinikker', description: 'Klinikker som anbefaler hudpleie til dyreeiere',
        filters: { industrikode: '75', kommunenummer: '', employeeRange: '' }, color: 'from-emerald-500 to-teal-500',
        include: /veterin|dyreklinikk|dyrlege|dyre.?hospital|smådyr|hest/i, exclude: null },
      { id: 'helsekost', emoji: '🌿', name: 'Helsekost & naturkost', description: 'Naturkostbutikker med økologiske produkter',
        filters: { industrikode: '47.29', kommunenummer: '', employeeRange: '' }, color: 'from-green-500 to-emerald-500',
        include: /helsekost|naturkost|økolog|helse.?butikk|vitamin|kosttilskudd|naturlig/i, exclude: null },
      { id: 'apotek', emoji: '💊', name: 'Apotek', description: 'Uavhengige apotek',
        filters: { industrikode: '47.73', kommunenummer: '', employeeRange: '' }, color: 'from-blue-500 to-indigo-500',
        include: null, exclude: null },
      { id: 'frisor', emoji: '💇', name: 'Frisørsalonger', description: 'Salonger som selger produkter over disk',
        filters: { industrikode: '96.210', kommunenummer: '', employeeRange: '' }, color: 'from-pink-500 to-rose-500',
        include: null, exclude: null },
      { id: 'hudpleie', emoji: '✨', name: 'Skjønnhets- og hudpleie', description: 'Hudpleieklinikker, negler, hudterapeuter',
        filters: { industrikode: '96.220', kommunenummer: '', employeeRange: '' }, color: 'from-rose-400 to-pink-500',
        include: null, exclude: null },
      { id: 'hotell-spa', emoji: '🏨', name: 'Hotell & spa', description: 'Hoteller med wellness-tilbud',
        filters: { industrikode: '55.10', kommunenummer: '', employeeRange: '11-50' }, color: 'from-purple-500 to-violet-500',
        include: null, exclude: null },
      { id: 'spa', emoji: '🧖', name: 'Spa & dagspa', description: 'Spa-er, badstuer og velværesentre',
        filters: { industrikode: '96.230', kommunenummer: '', employeeRange: '' }, color: 'from-indigo-400 to-violet-500',
        include: null, exclude: null },
      { id: 'sykehjem', emoji: '🏠', name: 'Sykehjem & omsorg', description: 'Pleieinstitusjoner — gjentakende bestillinger',
        filters: { industrikode: '87', kommunenummer: '', employeeRange: '' }, color: 'from-sky-500 to-blue-500',
        include: null, exclude: null },
    ],
    emailSegments: [
      { id: 'general', name: 'Generell', emoji: '📧', description: 'Standard outreach' },
      { id: 'dyrebutikker', name: 'Dyrebutikker', emoji: '🐕', description: 'Butikker med kjæledyrutstyr' },
      { id: 'veterinarer', name: 'Veterinærklinikker', emoji: '🏥', description: 'Dyreklinikker' },
      { id: 'helsekost', name: 'Helsekost & naturkost', emoji: '🌿', description: 'Naturkostbutikker' },
      { id: 'apotek', name: 'Apotek', emoji: '💊', description: 'Uavhengige apotek' },
      { id: 'frisor', name: 'Frisørsalonger', emoji: '💇', description: 'Salonger' },
      { id: 'hudpleie', name: 'Skjønnhets- og hudpleie', emoji: '✨', description: 'Hudpleieklinikker' },
      { id: 'hotell-spa', name: 'Hotell & spa', emoji: '🏨', description: 'Hoteller' },
      { id: 'spa', name: 'Spa & dagspa', emoji: '🧖', description: 'Spa og velvære' },
      { id: 'sykehjem', name: 'Sykehjem & omsorg', emoji: '🏠', description: 'Pleieinstitusjoner' },
    ],
    emailTemplates: {
      general: {
        subject: '{{contact_name}} — {{sender_company}} kan hjelpe {{company_name}}',
        body: `Hei {{contact_name}},

Jeg ser at {{company_name}} jobber innenfor {{industry}} i {{city}}, og tar kontakt fordi vi tror det kan være en god match.

Vi tilbyr naturlig hudpleie basert på pH4-teknologi — uten parabener og kjemikalier.

Hadde det passet med en kort samtale denne uken?

Vennlig hilsen,
{{sender_name}}
{{sender_company}}`
      },
      dyrebutikker: {
        subject: '{{contact_name}} — naturlig dyrepleie for kundene til {{company_name}}',
        body: `Hei {{contact_name}},

Jeg ser at {{company_name}} selger kjæledyrprodukter i {{city}}, og tar kontakt fordi vi har noe kundene deres etterspør.

Vi har utviklet en naturlig hudpleieserie for dyr basert på pH4-teknologi — uten parabener og kjemikalier. Produktene hjelper mot kløe, tørr hud og eksem hos hund, hest og andre dyr.

Mange dyrebutikker opplever høy kundelojalitet med våre produkter fordi de faktisk virker — og kundene kommer tilbake for påfyll.

Kan jeg sende dere noen prøver? Det tar 5 minutter å sette opp som forhandler.

Vennlig hilsen,
{{sender_name}}
{{sender_company}}`
      },
      veterinarer: {
        subject: '{{contact_name}} — dokumentert hudpleie dere kan anbefale til dyreeiere',
        body: `Hei {{contact_name}},

Som veterinærklinikk i {{city}} møter dere sannsynligvis mange dyreeiere som sliter med kløe og hudproblemer hos kjæledyrene sine.

Vi har utviklet en pH4-basert hudpleieserie med organiske syrer og alginat som bevarer dyrets naturlige bakterieflora — i stedet for å ødelegge den med tradisjonelle sjampoer.

Mange veterinærer anbefaler oss allerede til sine kunder. Kan jeg sende informasjon og noen prøver til klinikken?

Vennlig hilsen,
{{sender_name}}
{{sender_company}}`
      },
      helsekost: {
        subject: '{{contact_name}} — norskprodusert naturlig hudpleie for {{company_name}}',
        body: `Hei {{contact_name}},

Jeg ser at {{company_name}} selger naturlige og økologiske produkter i {{city}}. Da tror jeg vi passer rett inn i sortimentet deres.

Vi lager naturlig hudpleie basert på pH4-teknologi — uten parabener, parfyme og miljøgifter. Alle ingredienser utenom vaskestoff er godkjent til bruk i mat.

Produktene våre selger spesielt godt i helsekostbutikker fordi kundene allerede er bevisste på hva de putter på huden.

Kan vi ta en prat om å få produktene inn hos dere?

Vennlig hilsen,
{{sender_name}}
{{sender_company}}`
      },
    },
  },
  {
    id: 'mobelrens',
    name: 'Møbelrenseren',
    description: 'Profesjonell møbelrens for hoteller, restauranter, barer og andre med mye gjester',
    icon: '🛋️',
    color: '#10B981',
    icp: {
      companyName: 'Møbelrenseren',
      yourIndustry: 'Rengjøring / Tjenester',
      whatYouSell: 'Profesjonell møbelrens — vi rengjør sofaer, stoler, tepper og andre tekstilmøbler på stedet. Perfekt for steder med høy slitasje fra gjester.',
      targetIndustries: 'Hoteller, restauranter, barer, kafeer, konferansesentre, nattklubber',
      companySize: '11–50 ansatte',
      targetRegion: '',
      problemYouSolve: 'Vi hjelper serveringssteder og hoteller med å holde møblene rene, frisket opp og presentable — uten at de trenger å bytte ut dyre møbler. Sparer penger og gir bedre gjesteopplevelse.',
      decisionMakerTitle: 'Daglig leder, Driftssjef, Hotelldirektør',
      decisionMakerDept: 'Drift',
    },
    suggestedSearches: [
      { id: 'hoteller', emoji: '🏨', name: 'Hoteller', description: '1 600+ hoteller med lounge, lobby og rom',
        filters: { industrikode: '55.100', kommunenummer: '', employeeRange: '' }, color: 'from-purple-500 to-violet-500',
        include: null, exclude: null },
      { id: 'restauranter', emoji: '🍽️', name: 'Restauranter', description: '8 600+ restauranter med stoppede stoler og sittegrupper',
        filters: { industrikode: '56.110', kommunenummer: '', employeeRange: '' }, color: 'from-red-500 to-orange-500',
        include: null, exclude: null },
      { id: 'barer', emoji: '🍸', name: 'Barer & puber', description: '700+ barer og nattklubber med høy gjennomstrømning',
        filters: { industrikode: '56.300', kommunenummer: '', employeeRange: '' }, color: 'from-amber-500 to-yellow-500',
        include: null, exclude: null },
      { id: 'kafeer', emoji: '☕', name: 'Kafeer', description: 'Kafeer med sofagrupper og loungemøbler',
        filters: { industrikode: '56.110', kommunenummer: '', employeeRange: '1-10' }, color: 'from-amber-600 to-amber-400',
        include: /kafe|café|coffee|kaffe|bakeri/i, exclude: null },
      { id: 'catering', emoji: '🍱', name: 'Catering', description: '900+ cateringselskaper for arrangementer',
        filters: { industrikode: '56.210', kommunenummer: '', employeeRange: '' }, color: 'from-orange-400 to-red-400',
        include: null, exclude: null },
      { id: 'konferanse', emoji: '🎤', name: 'Konferansesentre', description: '215 konferansehoteller og møtesentre',
        filters: { industrikode: '82.300', kommunenummer: '', employeeRange: '' }, color: 'from-blue-500 to-indigo-500',
        include: null, exclude: null },
      { id: 'overnatting', emoji: '🛏️', name: 'Annen overnatting', description: '1 000+ pensjonater, hosteller og B&B',
        filters: { industrikode: '55.200', kommunenummer: '', employeeRange: '' }, color: 'from-teal-500 to-cyan-500',
        include: null, exclude: null },
      { id: 'treningssenter', emoji: '💪', name: 'Treningssentre', description: '1 000+ treningssentre med loungeområder',
        filters: { industrikode: '93.130', kommunenummer: '', employeeRange: '' }, color: 'from-green-500 to-emerald-500',
        include: null, exclude: null },
      { id: 'kontorer', emoji: '🏢', name: 'Kontorhotell & coworking', description: 'Kontorfellesskap med fellesarealer',
        filters: { industrikode: '68.200', kommunenummer: '', employeeRange: '' }, color: 'from-sky-500 to-blue-500',
        include: /kontor.?hotell|cowork|co-work|kontorfellesskap|felles.?kontor/i, exclude: null },
    ],
    emailSegments: [
      { id: 'general', name: 'Generell', emoji: '📧', description: 'Standard outreach' },
      { id: 'hoteller', name: 'Hoteller', emoji: '🏨', description: 'Hoteller' },
      { id: 'restauranter', name: 'Restauranter', emoji: '🍽️', description: 'Restauranter' },
      { id: 'barer', name: 'Barer & puber', emoji: '🍸', description: 'Barer og puber' },
      { id: 'kafeer', name: 'Kafeer', emoji: '☕', description: 'Kafeer' },
      { id: 'konferanse', name: 'Konferansesentre', emoji: '🎤', description: 'Konferansesentre' },
    ],
    emailTemplates: {
      general: {
        subject: '{{contact_name}} — hold møblene på {{company_name}} som nye',
        body: `Hei {{contact_name}},

Jeg ser at {{company_name}} i {{city}} har mange gjester daglig — da vet du at møblene tar mye juling.

Vi i Møbelrenseren tilbyr profesjonell rens av sofaer, stoler, tepper og andre tekstilmøbler direkte på stedet. Vi fjerner flekker, lukt og oppsamlet smuss — slik at møblene ser nye ut igjen.

Det er mye rimeligere enn å kjøpe nytt, og gjestene merker forskjellen.

Kan vi ta en titt på hva dere har behov for? Vi gir gjerne et uforpliktende tilbud.

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
      hoteller: {
        subject: '{{contact_name}} — profesjonell møbelrens for {{company_name}}',
        body: `Hei {{contact_name}},

Som hotelldirektør/driftssjef på {{company_name}} i {{city}} vet du at førsteinntrykket betyr alt for gjestene.

Lobbyen, restauranten og rommene har møbler som brukes av hundrevis av gjester hver uke. Over tid samler det seg flekker, lukt og generell slitasje som gjestene legger merke til — selv om resten av hotellet er plettfritt.

Vi i Møbelrenseren rengjør alle typer tekstilmøbler direkte hos dere, med minimal forstyrrelse for driften. Mange hoteller bruker oss fast 2-4 ganger i året.

Kan jeg komme innom for å se på omfanget og gi et uforpliktende tilbud?

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
      restauranter: {
        subject: '{{contact_name}} — rene stoler og sofaer for gjestene på {{company_name}}',
        body: `Hei {{contact_name}},

Stoppede stoler og sittegrupper på {{company_name}} i {{city}} utsettes for mat, drikke og daglig slitasje fra gjestene.

Vi i Møbelrenseren renser alle typer tekstilmøbler på stedet — vi fjerner flekker, matlukt og oppsamlet smuss. Resultatet er møbler som ser og lukter som nye.

De fleste restauranter vi jobber med bestiller rens 2-4 ganger i året, og sparer tusenvis på å slippe å bytte ut møbler.

Kan jeg sende et tilbud basert på antall stoler/sofaer dere har?

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
      barer: {
        subject: '{{contact_name}} — møbelrens for {{company_name}}',
        body: `Hei {{contact_name}},

Barer og puber har høy gjennomstrømning — og møblene tar ofte det hardeste støtet med søl, lukt og generell slitasje.

Vi i Møbelrenseren kan frisket opp alle stoppede møbler, fra barstoler til loungesofaer, direkte hos dere. Vi jobber gjerne på dagtid når dere er stengt.

Det tar vanligvis bare noen timer, og forskjellen er dramatisk. Mange barer booker oss fast hver måned eller annenhver måned.

Skal jeg komme innom for å ta en titt?

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
      kafeer: {
        subject: '{{contact_name}} — frisket opp møblene på {{company_name}}',
        body: `Hei {{contact_name}},

Kafeer med sofagrupper og loungemøbler i {{city}} tiltrekker gjester som blir lenge — og det betyr mer slitasje på møblene.

Vi i Møbelrenseren rengjør sofaer, lenestoler og puter direkte hos dere. Vi fjerner kaffeflekker, lukt og hverdagsslitasje slik at gjestene føler seg velkomne.

Kan jeg gi et raskt tilbud basert på hva dere har?

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
      konferanse: {
        subject: '{{contact_name}} — ren møbler for konferansegjestene på {{company_name}}',
        body: `Hei {{contact_name}},

Konferansestoler og sittegrupper på {{company_name}} brukes av mange forskjellige mennesker hver uke. Over tid samler det seg svette, flekker og lukt som gir et dårlig inntrykk.

Vi i Møbelrenseren rengjør alt fra konferansestoler til loungemøbler — direkte på stedet, med rask tørketid.

Mange konferansesentre bruker oss 3-4 ganger i året for å holde standarden oppe. Kan jeg sende et tilbud?

Vennlig hilsen,
{{sender_name}}
Møbelrenseren`
      },
    },
  },
]

export default TEMPLATES

/**
 * Get a template by ID
 */
export function getTemplate(id) {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}

/**
 * Get the currently active template from localStorage
 */
export function getActiveTemplate() {
  const id = localStorage.getItem('leadflow_template')
  return getTemplate(id)
}

/**
 * Set the active template and optionally auto-fill ICP
 */
export function applyTemplate(id) {
  const template = getTemplate(id)
  localStorage.setItem('leadflow_template', id)

  // Auto-fill ICP if template has ICP data
  if (template.icp && Object.keys(template.icp).length > 0) {
    const existingIcp = JSON.parse(localStorage.getItem('leadflow_icp') || '{}')
    // Merge: template values fill in blanks, but don't overwrite user edits
    const merged = { ...template.icp }
    for (const [key, value] of Object.entries(existingIcp)) {
      if (value) merged[key] = value // keep user's existing values
    }
    localStorage.setItem('leadflow_icp', JSON.stringify(merged))
  }

  return template
}
