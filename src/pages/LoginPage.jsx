import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!forgotEmail.trim()) { toast.error('Skriv inn e-postadressen din'); return }
    setForgotLoading(true)
    try {
      const { error } = await resetPassword(forgotEmail.trim())
      if (error) toast.error(error.message || 'Kunne ikke sende tilbakestillingslenke')
      else setForgotSent(true)
    } catch { toast.error('Noe gikk galt') }
    finally { setForgotLoading(false) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === 'signup') {
        const { error } = await signUp({ email, password, fullName, companyName })
        if (error) toast.error(error.message || 'Kunne ikke opprette konto')
        else { setRegisteredEmail(email); setEmailSent(true) }
      } else {
        const { error } = await signIn({ email, password })
        if (error) {
          if (error.message?.includes('Email not confirmed')) toast.error('E-posten din er ikke verifisert enda.')
          else toast.error(error.message || 'Feil e-post eller passord')
        }
      }
    } catch { toast.error('Noe gikk galt') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 hero-grid" />
      <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] orb-1"
        style={{ background: 'radial-gradient(circle, #7C5CFC, transparent 70%)' }} />
      <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] orb-2"
        style={{ background: 'radial-gradient(circle, #FF6B4A, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Back button */}
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 text-[0.85rem] mb-8 transition-colors">
          <ArrowLeft size={16} /> Tilbake
        </button>

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse-glow"
              style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
          <h1 className="font-display text-[2.5rem] font-bold text-white tracking-tight">
            Lead<span className="text-coral">Flow</span>
          </h1>
          <p className="text-white/35 text-[0.95rem] mt-2">
            Finn dine neste kunder, enkelt og effektivt.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 glass-dark">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' }}>
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Sjekk e-posten din!</h2>
              <p className="text-white/40 text-[0.9rem] mb-6 leading-relaxed">
                Vi har sendt en verifiseringslenke til<br />
                <strong className="text-white">{registeredEmail}</strong>
              </p>
              <div className="p-4 bg-white/[0.03] rounded-xl text-left mb-6 space-y-3">
                {['Apne e-posten fra LeadFlow', 'Klikk pa verifiseringslenken', 'Kom tilbake hit og logg inn'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[0.72rem] font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FF6B4A, #FF8F6B)' }}>{i + 1}</span>
                    <p className="text-[0.85rem] text-white/40">{step}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setEmailSent(false); setTab('login') }}
                className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                ← Ga til innlogging
              </button>
              <p className="text-white/25 text-[0.78rem] mt-4">
                Ikke mottatt e-post? Sjekk soppelpost-mappen, eller{' '}
                <button onClick={() => { setEmailSent(false); setTab('signup') }} className="text-coral hover:underline">prov igjen</button>
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-white/[0.04] rounded-xl p-[3px] mb-8">
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-[0.875rem] font-medium transition-all ${
                      tab === t ? 'text-white' : 'text-white/35 hover:text-white/60'
                    }`}
                    style={tab === t ? { background: 'linear-gradient(135deg, #FF6B4A, #FF8F6B)' } : {}}>
                    {t === 'login' ? 'Logg inn' : 'Opprett konto'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {tab === 'signup' && (
                  <>
                    {[
                      { label: 'Fullt navn', value: fullName, set: setFullName, type: 'text', placeholder: 'Jonas Dahl' },
                      { label: 'Selskapsnavn', value: companyName, set: setCompanyName, type: 'text', placeholder: 'Acme AS' },
                    ].map(f => (
                      <div key={f.label} className="mb-4">
                        <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">{f.label}</label>
                        <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                          className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/10 transition-all" />
                      </div>
                    ))}
                  </>
                )}

                <div className="mb-4">
                  <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/10 transition-all" />
                </div>

                <div className="mb-2">
                  <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">Passord</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6}
                      className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/10 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors text-[0.8rem]">
                      {showPassword ? 'Skjul' : 'Vis'}
                    </button>
                  </div>
                </div>

                {tab === 'login' && (
                  <div className="flex justify-end mt-1">
                    <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true) }}
                      className="text-[0.8rem] text-white/30 hover:text-coral transition-colors">
                      Glemt passord?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full mt-6 py-3.5 rounded-xl font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(255,107,74,0.2)]"
                  style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Laster...
                    </span>
                  ) : tab === 'signup' ? 'Opprett konto' : 'Logg inn'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-white/20 text-[0.8rem]">
          Brukt av 120+ norske bedrifter
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowForgot(false); setForgotSent(false) }}>
          <div className="w-full max-w-[400px] rounded-2xl p-8 glass-dark" onClick={e => e.stopPropagation()}>
            {forgotSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' }}>
                  <span className="text-3xl">📧</span>
                </div>
                <h2 className="text-white text-xl font-semibold mb-2">Sjekk e-posten din!</h2>
                <p className="text-white/40 text-[0.9rem] mb-6 leading-relaxed">
                  Vi har sendt en lenke for å tilbakestille passordet til<br />
                  <strong className="text-white">{forgotEmail}</strong>
                </p>
                <div className="p-4 bg-white/[0.03] rounded-xl text-left mb-6 space-y-3">
                  {['Åpne e-posten fra LeadFlow', 'Klikk på tilbakestillingslenken', 'Velg ditt nye passord'].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[0.72rem] font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7C5CFC, #A78BFA)' }}>{i + 1}</span>
                      <p className="text-[0.85rem] text-white/40">{step}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                  className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                  ← Tilbake til innlogging
                </button>
                <p className="text-white/25 text-[0.78rem] mt-4">
                  Ikke mottatt e-post? Sjekk søppelpost-mappen.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-white text-xl font-semibold mb-2">Glemt passord?</h2>
                <p className="text-white/40 text-[0.88rem] mb-6">
                  Skriv inn e-postadressen din, så sender vi en lenke for å tilbakestille passordet.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-5">
                    <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">E-post</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@company.com" required autoFocus
                      className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/10 transition-all" />
                  </div>
                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 100%)' }}>
                    {forgotLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        Sender...
                      </span>
                    ) : 'Send tilbakestillingslenke'}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)}
                    className="w-full mt-3 py-2.5 rounded-xl text-[0.88rem] text-white/30 hover:text-white/60 transition-colors">
                    Avbryt
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
