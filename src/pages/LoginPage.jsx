import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
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
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(0,0,0,0.025), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.025), transparent 50%)'
      }} />

      <div className="relative z-10 w-full max-w-[420px] px-6 py-10">
        {/* Back button */}
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-[0.85rem] mb-8 transition-colors">
          <ArrowLeft size={16} /> Tilbake
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-900">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
          <h1 className="font-display text-[2.2rem] font-bold text-gray-900 tracking-tight">
            LeadFlow
          </h1>
          <p className="text-gray-500 text-[0.95rem] mt-2">
            Finn dine neste kunder, enkelt og effektivt.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-7 bg-white border border-gray-200 shadow-sm">
          {emailSent ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <Check size={24} className="text-green-600" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2 text-gray-900">Sjekk e-posten din!</h2>
              <p className="text-gray-500 text-[0.9rem] mb-6 leading-relaxed">
                Vi har sendt en verifiseringslenke til<br />
                <strong className="text-gray-900">{registeredEmail}</strong>
              </p>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-left mb-6 space-y-3">
                {['Åpne e-posten fra LeadFlow', 'Klikk på verifiseringslenken', 'Kom tilbake hit og logg inn'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[0.72rem] font-bold text-white bg-gray-900 flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-[0.85rem] text-gray-600">{step}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => { setEmailSent(false); setTab('login') }}
                className="w-full py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-gray-900 hover:bg-gray-800 transition-all">
                ← Gå til innlogging
              </button>
              <p className="text-gray-400 text-[0.78rem] mt-4">
                Ikke mottatt e-post? Sjekk søppelpost-mappen, eller{' '}
                <button onClick={() => { setEmailSent(false); setTab('signup') }} className="text-gray-900 font-medium hover:underline">prøv igjen</button>
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-7">
                {['login', 'signup'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2 px-4 rounded-md text-[0.85rem] font-medium transition-all ${
                      tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}>
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
                        <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">{f.label}</label>
                        <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                      </div>
                    ))}
                  </>
                )}

                <div className="mb-4">
                  <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">E-post</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="du@bedrift.no" required
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                </div>

                <div className="mb-2">
                  <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">Passord</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6}
                      className="w-full px-3.5 py-2.5 pr-14 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors text-[0.8rem] font-medium">
                      {showPassword ? 'Skjul' : 'Vis'}
                    </button>
                  </div>
                </div>

                {tab === 'login' && (
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => { setForgotEmail(email); setShowForgot(true) }}
                      className="text-[0.8rem] text-gray-500 hover:text-gray-900 transition-colors">
                      Glemt passord?
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full mt-6 py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Laster...
                    </span>
                  ) : tab === 'signup' ? 'Opprett konto' : 'Logg inn'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <p className="text-center text-gray-400 text-[0.8rem]">
            Brukt av 120+ norske bedrifter
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowForgot(false); setForgotSent(false) }}>
          <div className="w-full max-w-[400px] rounded-xl p-7 bg-white border border-gray-200 shadow-xl" onClick={e => e.stopPropagation()}>
            {forgotSent ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                  <Check size={24} className="text-green-600" />
                </div>
                <h2 className="font-display text-xl font-semibold mb-2 text-gray-900">Sjekk e-posten din!</h2>
                <p className="text-gray-500 text-[0.9rem] mb-6 leading-relaxed">
                  Vi har sendt en lenke for å tilbakestille passordet til<br />
                  <strong className="text-gray-900">{forgotEmail}</strong>
                </p>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-left mb-6 space-y-3">
                  {['Åpne e-posten fra LeadFlow', 'Klikk på tilbakestillingslenken', 'Velg ditt nye passord'].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[0.72rem] font-bold text-white bg-gray-900 flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-[0.85rem] text-gray-600">{step}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setShowForgot(false); setForgotSent(false) }}
                  className="w-full py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-gray-900 hover:bg-gray-800 transition-all">
                  ← Tilbake til innlogging
                </button>
                <p className="text-gray-400 text-[0.78rem] mt-4">
                  Ikke mottatt e-post? Sjekk søppelpost-mappen.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold mb-2 text-gray-900">Glemt passord?</h2>
                <p className="text-gray-500 text-[0.88rem] mb-6">
                  Skriv inn e-postadressen din, så sender vi en lenke for å tilbakestille passordet.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-5">
                    <label className="block text-[0.78rem] font-semibold text-gray-700 mb-1.5">E-post</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="du@bedrift.no" required autoFocus
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-300 text-[0.9rem] outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                  <button type="submit" disabled={forgotLoading}
                    className="w-full py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-gray-900 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {forgotLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        Sender...
                      </span>
                    ) : 'Send tilbakestillingslenke'}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)}
                    className="w-full mt-3 py-2.5 rounded-lg text-[0.88rem] text-gray-500 hover:text-gray-900 transition-colors">
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
