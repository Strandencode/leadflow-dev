/**
 * LeadFlow Business Templates
 *
 * Each template pre-fills ICP, suggested searches (NACE codes),
 * and email templates for a specific business type.
 *
 * The default install ships with a single "general" template so new
 * customers start from scratch. Industry-specific templates can be
 * added here per-customer (see the `templates_leadflow` branch for
 * historical examples).
 *
 * To add a new template: copy the general template and adjust the
 * fields. Required keys: id, name, description, icon, color, icp,
 * suggestedSearches, emailSegments, emailTemplates.
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
    emailSegments: [
      { id: 'general', name: 'Generell', emoji: '📧', description: 'Standard e-postmal' },
    ],
    emailTemplates: {
      general: {
        subject: '{{contact_name}} — {{sender_company}} kan hjelpe {{company_name}}',
        body: `Hei {{contact_name}},

Jeg ser at {{company_name}} jobber innenfor {{industry}} i {{city}}, og tar kontakt fordi vi tror det kan være en god match.

[Beskriv kort hva dere tilbyr og hvilken verdi det har for mottakeren.]

Hadde det passet med en kort samtale denne uken?

Vennlig hilsen,
{{sender_name}}
{{sender_company}}`
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
