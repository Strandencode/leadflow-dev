import { useState, useEffect } from 'react'
import { X, Mail, Sparkles, Loader2, ChevronDown, Lock } from 'lucide-react'
import { useUsage } from '../hooks/useUsage'
import toast from 'react-hot-toast'

const TEMPLATES_KEY = 'leadflow_saved_templates'
const ICP_KEY = 'leadflow_icp'

function getICP() {
  try {
    const stored = localStorage.getItem(ICP_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch { return {} }
}

function mergeTags(text, company, icp) {
  if (!text) return ''
  return text
    .replaceAll('{{contact_name}}', company.contactName && company.contactName !== '—' ? company.contactName : '')
    .replaceAll('{{company_name}}', company.name || '')
    .replaceAll('{{industry}}', company.industry || '')
    .replaceAll('{{city}}', company.city || company.municipality || '')
    .replaceAll('{{revenue}}', company.revenue ? `${(company.revenue/1e6).toFixed(1)}M NOK` : '')
    .replaceAll('{{sender_name}}', icp.senderName || icp.companyName || '')
    .replaceAll('{{sender_company}}', icp.companyName || '')
    .replace(/\n\n\n+/g, '\n\n')
    .trim()
}

// AI personalization — adds custom opening + ensures all fields filled
function aiPersonalize(subject, body, company, icp) {
  const hooks = []
  if (company.employees && company.employees > 20) hooks.push(`Med ${company.employees} ansatte vet jeg at ${company.name} har et solid grunnlag`)
  else if (company.employees && company.employees <= 5) hooks.push(`Som en fokusert bedrift med ${company.employees} ansatte setter ${company.name} nok pris på leverandører som leverer kvalitet`)
  if (company.revenue && company.revenue > 10e6) hooks.push(`Jeg ser at ${company.name} omsetter for over ${(company.revenue/1e6).toFixed(0)} millioner — imponerende`)
  else if (company.revenue && company.revenue > 1e6) hooks.push(`Med en omsetning på ${(company.revenue/1e6).toFixed(1)} millioner er ${company.name} akkurat den typen bedrift vi samarbeider best med`)
  if (company.foundedDate && company.foundedDate > '2020') hooks.push(`Som et relativt nytt selskap (stiftet ${company.foundedDate.slice(0,4)}) har ${company.name} sikkert fokus på å bygge riktig sortiment`)
  if (company.foundedDate && company.foundedDate < '2005') hooks.push(`Med over ${new Date().getFullYear() - parseInt(company.foundedDate.slice(0,4))} års erfaring vet ${company.name} hva kundene vil ha`)
  if (company.municipality) hooks.push(`Som en etablert aktør i ${company.municipality} treffer dere nok mange som etterspør naturlige alternativer`)
  if (company.accountant) hooks.push(`Jeg ser at dere bruker ${company.accountant} som regnskapsfører — alltid godt å ha orden i sakene`)

  const hook = hooks.length > 0 ? hooks[Math.floor(Math.random() * hooks.length)] + '.\n\n' : ''

  const personalizedBody = body.replace(
    /^(Hei .+?,?\n?\n?)/,
    `$1${hook}`
  )

  return { subject: mergeTags(subject, company, icp), body: mergeTags(personalizedBody, company, icp) }
}

export default function EmailComposerModal({ companies, onClose, onSend, mailClient }) {
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [useAI, setUseAI] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewCompany, setPreviewCompany] = useState(companies[0] || null)
  const [icp, setIcp] = useState({})
  const { canSendEmails, trackEmails, emailsRemaining, planName, plan } = useUsage()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TEMPLATES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setTemplates(parsed)
        if (parsed.length > 0) {
          setSelectedTemplateId(parsed[0].id)
          setSelectedTemplate(parsed[0])
        }
      }
    } catch {}
    setIcp(getICP())
  }, [])

  function handleTemplateChange(id) {
    setSelectedTemplateId(id)
    const t = templates.find(t => t.id === id)
    setSelectedTemplate(t || null)
  }

  function getPreviewText() {
    if (!selectedTemplate || !previewCompany) return { subject: '', body: '' }
    if (useAI) return aiPersonalize(selectedTemplate.subject, selectedTemplate.body, previewCompany, icp)
    return {
      subject: mergeTags(selectedTemplate.subject, previewCompany, icp),
      body: mergeTags(selectedTemplate.body, previewCompany, icp),
    }
  }

  function buildUrl(company, client) {
    const { subject, body } = useAI
      ? aiPersonalize(selectedTemplate.subject, selectedTemplate.body, company, icp)
      : { subject: mergeTags(selectedTemplate.subject, company, icp), body: mergeTags(selectedTemplate.body, company, icp) }

    const encodedSubject = encodeURIComponent(subject)
    const encodedBody = encodeURIComponent(body)

    if (client === 'gmail') {
      return `https://mail.google.com/mail/?view=cm&to=${company.email || ''}&su=${encodedSubject}&body=${encodedBody}`
    }
    return `https://outlook.office.com/mail/deeplink/compose?to=${company.email || ''}&subject=${encodedSubject}&body=${encodedBody}`
  }

  async function handleSend(client) {
    if (!selectedTemplate) { toast.error('Velg en mal først'); return }
    const withEmail = companies.filter(c => c.email)
    if (!withEmail.length) { toast.error('Ingen valgte har e-post'); return }

    // Check plan limits
    if (!canSendEmails(withEmail.length)) {
      toast.error(`Du har ${emailsRemaining} e-poster igjen denne måneden (${planName}-plan). Oppgrader for å sende flere.`)
      return
    }

    setSending(true)
    const MAX = 10
    const batch = withEmail.slice(0, MAX)

    if (useAI) {
      await new Promise(r => setTimeout(r, 500))
    }

    batch.forEach(c => {
      window.open(buildUrl(c, client), '_blank')
    })

    // Track usage
    trackEmails(batch.length)

    setSending(false)

    if (withEmail.length > MAX) {
      toast(`Åpnet ${MAX} av ${withEmail.length} — gjenta for resten`, { icon: '⚠️' })
    } else {
      toast.success(`${batch.length} e-poster åpnet! (${emailsRemaining - batch.length} igjen denne mnd)`)
    }

    onSend(batch.map(c => c.orgNumber))
    onClose()
  }

  const preview = getPreviewText()
  const withEmail = companies.filter(c => c.email)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-raised rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-bdr flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-display text-lg font-semibold">Send e-post til {companies.length} selskaper</h3>
            <p className="text-[0.82rem] text-txt-secondary">{withEmail.length} av {companies.length} har e-post</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-sunken transition-all"><X size={20} className="text-txt-tertiary" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Template selector */}
          <div>
            <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Velg e-postmal</label>
            {templates.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[0.85rem] text-amber-700">
                Du har ingen lagrede maler. Gå til <strong>E-postmaler</strong> i menyen for å lage en først.
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedTemplateId}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none appearance-none cursor-pointer focus:border-violet focus:ring-2 focus:ring-violet-soft"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.segmentEmoji || '📧'} {t.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none" />
              </div>
            )}
          </div>

          {/* AI toggle */}
          <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-bdr">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className={useAI ? 'text-violet' : 'text-txt-tertiary'} />
              <div>
                <div className="text-[0.88rem] font-medium">AI-tilpasning per selskap</div>
                <div className="text-[0.78rem] text-txt-tertiary">Tilpasser åpningen basert på selskapets størrelse, omsetning og alder</div>
              </div>
            </div>
            <button
              onClick={() => setUseAI(!useAI)}
              className={`relative w-12 h-6 rounded-full transition-all ${useAI ? 'bg-violet' : 'bg-surface-sunken'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useAI ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* ICP sender info */}
          <div className="p-4 bg-surface rounded-xl border border-bdr">
            <div className="text-[0.78rem] font-semibold uppercase tracking-wide text-txt-tertiary mb-2">Avsender (fra ICP-profilen)</div>
            <div className="grid grid-cols-2 gap-2 text-[0.82rem]">
              <div className="flex justify-between"><span className="text-txt-tertiary">Selskap:</span><span className="font-medium">{icp.companyName || <span className="text-amber-500 italic">Ikke satt</span>}</span></div>
              <div className="flex justify-between"><span className="text-txt-tertiary">Kontakt:</span><span className="font-medium">{icp.senderName || icp.companyName || <span className="text-amber-500 italic">Ikke satt</span>}</span></div>
            </div>
            {!icp.companyName && (
              <p className="text-[0.75rem] text-amber-500 mt-2">Tips: Fyll ut ICP-profilen for å fylle inn avsenderinfo automatisk</p>
            )}
          </div>

          {/* Preview */}
          {selectedTemplate && previewCompany && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary">Forhåndsvisning</label>
                {companies.length > 1 && (
                  <select
                    value={previewCompany.orgNumber}
                    onChange={e => setPreviewCompany(companies.find(c => c.orgNumber === e.target.value))}
                    className="text-[0.78rem] px-2 py-1 bg-surface border border-bdr rounded-lg outline-none cursor-pointer"
                  >
                    {companies.slice(0, 10).map(c => (
                      <option key={c.orgNumber} value={c.orgNumber}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="p-5 bg-surface border border-bdr rounded-xl">
                <div className="text-[0.82rem] text-txt-secondary mb-1">
                  <strong>Til:</strong> {previewCompany.email || '—'}
                </div>
                <div className="text-[0.82rem] text-txt-secondary mb-3">
                  <strong>Emne:</strong> {preview.subject}
                </div>
                <div className="text-[0.88rem] leading-relaxed whitespace-pre-line text-txt-primary">
                  {preview.body}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-bdr flex-shrink-0 bg-surface-sunken/30">
          {/* Usage bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[0.78rem] text-txt-tertiary">
              {emailsRemaining === Infinity
                ? <span className="text-green-600 font-medium">Unlimited plan — ingen grense</span>
                : <>{emailsRemaining} av {plan === 'free' ? '20' : '1 000'} e-poster igjen denne mnd</>
              }
            </div>
            <span className="text-[0.72rem] px-2 py-0.5 rounded-full bg-surface-sunken text-txt-tertiary font-medium">{planName}</span>
          </div>
          {emailsRemaining !== Infinity && (
            <div className="w-full bg-surface-sunken rounded-full h-1.5 mb-3">
              <div className="h-1.5 rounded-full transition-all" style={{
                width: `${Math.min(100, ((plan === 'free' ? 20 : 1000) - emailsRemaining) / (plan === 'free' ? 20 : 1000) * 100)}%`,
                backgroundColor: emailsRemaining < 5 ? '#ef4444' : emailsRemaining < 10 ? '#f59e0b' : '#7c5cfc'
              }}/>
            </div>
          )}
          {!canSendEmails(withEmail.length) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[0.82rem] text-red-600 mb-3 flex items-center gap-2">
              <Lock size={14}/> Du trenger {withEmail.length} e-poster, men har bare {emailsRemaining} igjen. <a href="/settings" className="underline font-semibold">Oppgrader</a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-[0.82rem] text-txt-tertiary">
              {withEmail.length} e-poster vil bli åpnet {useAI && '(AI-tilpasset)'}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-[0.85rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">Avbryt</button>
              <button
                onClick={() => handleSend('gmail')}
                disabled={!selectedTemplate || !withEmail.length || sending || !canSendEmails(Math.min(withEmail.length, 10))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 transition-all"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Gmail ({Math.min(withEmail.length, 10)})
              </button>
              <button
                onClick={() => handleSend('outlook')}
                disabled={!selectedTemplate || !withEmail.length || sending || !canSendEmails(Math.min(withEmail.length, 10))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-all"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Outlook ({Math.min(withEmail.length, 10)})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
