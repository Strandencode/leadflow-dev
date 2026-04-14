import { useState, useEffect } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { getActiveTemplate } from '../config/templates'
import toast from 'react-hot-toast'

export default function ICPPage() {
  const activeTemplate = getActiveTemplate()
  const [icp, setIcp] = useState({
    companyName: '',
    senderName: '',
    yourIndustry: '',
    whatYouSell: '',
    targetIndustries: '',
    companySize: '',
    minRevenue: '',
    targetRegion: '',
    problemYouSolve: '',
    decisionMakerTitle: '',
    decisionMakerDept: '',
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('leadflow_icp')
      if (stored) setIcp(JSON.parse(stored))
    } catch {}
  }, [])

  function update(field, value) {
    setIcp(prev => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    // TODO: Save to Supabase
    localStorage.setItem('leadflow_icp', JSON.stringify(icp))
    toast.success('ICP-profil lagret!')
  }

  return (
    <div>
      <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="font-display text-[1.6rem] font-normal tracking-tight text-ink">ICP-profil</h1>
          <p className="text-txt-tertiary text-[0.82rem] mt-0.5 font-light">Definer din ideelle kundeprofil</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded text-[0.82rem] font-medium text-white bg-gold hover:bg-gold-light transition-all">
          <Save size={15} /> Lagre profil
        </button>
      </div>

      <div className="p-8 max-w-[740px]">
        {/* How ICP is used */}
        <div className="animate-in mb-6 p-4 rounded-lg border border-blue-100 bg-blue-50/50">
          <h4 className="text-[0.82rem] font-medium text-ink mb-1.5">Hvordan brukes ICP-profilen?</h4>
          <ul className="text-[0.78rem] text-txt-secondary font-light space-y-1">
            <li>• <strong>Selskapsnavn</strong> og <strong>ditt navn</strong> settes automatisk inn i genererte e-postmaler (erstatter flettefeltene &#123;&#123;sender_company&#125;&#125; og &#123;&#123;sender_name&#125;&#125;)</li>
            <li>• <strong>Hva du selger</strong> og <strong>problemet du løser</strong> brukes som fallback-tekst i e-poster uten bransjemal</li>
            <li>• Resten av feltene hjelper deg å holde oversikt over din ideelle kundeprofil</li>
          </ul>
        </div>

        {activeTemplate?.id !== 'general' && (
          <div className="animate-in mb-6 flex items-center gap-3 p-4 rounded-lg border border-gold/15 bg-gold/[0.03]">
            <Sparkles size={16} className="text-gold flex-shrink-0" />
            <div>
              <span className="text-[0.82rem] font-medium text-ink">
                Fylt ut fra <strong>{activeTemplate.icon} {activeTemplate.name}</strong>-malen
              </span>
              <span className="text-[0.78rem] text-txt-tertiary ml-1">— rediger feltene under for å tilpasse</span>
            </div>
          </div>
        )}
        {/* Step 1 */}
        <div className="animate-in delay-1 bg-surface-raised border border-bdr rounded-xl p-8 mb-6 relative">
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-coral-glow text-coral flex items-center justify-center font-bold text-[0.85rem]">1</div>
          <h3 className="font-display text-lg font-semibold mb-1">Om ditt selskap</h3>
          <p className="text-txt-secondary text-[0.9rem] mb-6">Fortell oss om din bedrift slik at vi kan finne de rette kundene for deg.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Selskapsnavn</label>
              <input
                type="text"
                value={icp.companyName}
                onChange={e => update('companyName', e.target.value)}
                placeholder="f.eks. Din Bedrift AS"
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Ditt navn (avsender i e-post)</label>
              <input
                type="text"
                value={icp.senderName}
                onChange={e => update('senderName', e.target.value)}
                placeholder="f.eks. Ola Nordmann"
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Din bransje</label>
              <select
                value={icp.yourIndustry}
                onChange={e => update('yourIndustry', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none appearance-none cursor-pointer"
              >
                <option value="">Velg bransje</option>
                <option>SaaS / Programvare</option>
                <option>Rådgivning</option>
                <option>Regnskap</option>
                <option>Markedsføringsbyrå</option>
                <option>Bygg og anlegg</option>
                <option>Helse</option>
                <option>Annet</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Hva selger du?</label>
              <textarea
                value={icp.whatYouSell}
                onChange={e => update('whatYouSell', e.target.value)}
                placeholder="Beskriv produktet eller tjenesten din kort. F.eks. 'Vi selger en alt-i-ett forretningsplattform med CRM, regnskap og markedsføringsverktøy for SMB-er i Norge.'"
                className="w-full min-h-[100px] px-4 py-3 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none resize-y focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="animate-in delay-2 bg-surface-raised border border-bdr rounded-xl p-8 mb-6 relative">
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-coral-glow text-coral flex items-center justify-center font-bold text-[0.85rem]">2</div>
          <h3 className="font-display text-lg font-semibold mb-1">Din ideelle kunde</h3>
          <p className="text-txt-secondary text-[0.9rem] mb-6">Beskriv selskapstypen som har størst nytte av produktet ditt.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Målbransjer</label>
              <input
                type="text"
                value={icp.targetIndustries}
                onChange={e => update('targetIndustries', e.target.value)}
                placeholder="f.eks. SaaS, Eiendom, Detaljhandel"
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Selskapsstørrelse</label>
              <select
                value={icp.companySize}
                onChange={e => update('companySize', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none appearance-none cursor-pointer"
              >
                <option value="">Alle størrelser</option>
                <option>1–10 ansatte</option>
                <option>11–50 ansatte</option>
                <option>51–200 ansatte</option>
                <option>200+ ansatte</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Min. omsetning (NOK)</label>
              <input
                type="text"
                value={icp.minRevenue}
                onChange={e => update('minRevenue', e.target.value)}
                placeholder="f.eks. 2 000 000"
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Målregion</label>
              <select
                value={icp.targetRegion}
                onChange={e => update('targetRegion', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none appearance-none cursor-pointer"
              >
                <option value="">Hele Norge</option>
                <option>Oslo-området</option>
                <option>Vestlandet</option>
                <option>Midt-Norge</option>
                <option>Nord-Norge</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Hvilket problem løser du for dem?</label>
              <textarea
                value={icp.problemYouSolve}
                onChange={e => update('problemYouSolve', e.target.value)}
                placeholder="F.eks. 'Vi hjelper småbedrifter med å spare 10+ timer i uken på regnskap og admin ved å automatisere fakturering, bokføring og kundebehandling.'"
                className="w-full min-h-[100px] px-4 py-3 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none resize-y focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="animate-in delay-3 bg-surface-raised border border-bdr rounded-xl p-8 mb-6 relative">
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-coral-glow text-coral flex items-center justify-center font-bold text-[0.85rem]">3</div>
          <h3 className="font-display text-lg font-semibold mb-1">Beslutningstaker</h3>
          <p className="text-txt-secondary text-[0.9rem] mb-6">Hvem tar typisk kjøpsbeslutningen hos dine målselskaper?</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Stillingstittel / rolle</label>
              <input
                type="text"
                value={icp.decisionMakerTitle}
                onChange={e => update('decisionMakerTitle', e.target.value)}
                placeholder="f.eks. Daglig leder, CFO, Markedssjef"
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none focus:border-violet focus:ring-2 focus:ring-violet-soft transition-all"
              />
            </div>
            <div>
              <label className="block text-[0.78rem] font-semibold uppercase tracking-wide text-txt-secondary mb-2">Avdeling</label>
              <select
                value={icp.decisionMakerDept}
                onChange={e => update('decisionMakerDept', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-bdr rounded-xl text-[0.9rem] outline-none appearance-none cursor-pointer"
              >
                <option value="">Ledelse / Executive</option>
                <option>Finans</option>
                <option>Markedsføring</option>
                <option>Salg</option>
                <option>IT / Teknologi</option>
                <option>Drift</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button className="px-5 py-2.5 rounded-xl text-[0.875rem] font-medium border border-bdr text-txt-secondary hover:bg-surface-sunken transition-all">
            Avbryt
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.875rem] font-medium bg-coral text-white hover:bg-coral-hover transition-all">
            Lagre ICP og start søk
          </button>
        </div>
      </div>
    </div>
  )
}
