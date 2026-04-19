import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { BRAND } from '../config/brand'

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { toast.error('Passordet må være minst 6 tegn'); return }
    if (password !== confirmPassword) { toast.error('Passordene stemmer ikke overens'); return }
    setLoading(true)
    try {
      const { error } = await updatePassword(password)
      if (error) toast.error(error.message || 'Kunne ikke oppdatere passordet')
      else setSuccess(true)
    } catch { toast.error('Noe gikk galt') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(0,0,0,0.025), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.025), transparent 50%)'
      }} />

      <div className="relative z-10 w-full max-w-[420px] px-6 py-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-ink">
              <span className="text-white font-bold text-lg">L</span>
            </div>
          </div>
          <h1 className="font-display text-[2.2rem] font-bold text-ink tracking-tight">
            {BRAND.name}
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-xl p-7 bg-white border border-bdr shadow-sm">
          {success ? (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-sage-bright/30 flex items-center justify-center mx-auto mb-5">
                <Check size={24} className="text-sage sage-accent" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2 text-ink">Passord oppdatert!</h2>
              <p className="text-ink-muted text-[0.9rem] mb-6 leading-relaxed">
                Passordet ditt er nå endret. Du kan logge inn med det nye passordet.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-ink hover:bg-ink-soft transition-all">
                Gå til innlogging
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold mb-2 text-ink">Velg nytt passord</h2>
              <p className="text-ink-muted text-[0.88rem] mb-6">
                Skriv inn ditt nye passord nedenfor.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[0.78rem] font-semibold text-ink mb-1.5">Nytt passord</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Minst 6 tegn" required minLength={6} autoFocus
                      className="w-full px-3.5 py-2.5 pr-14 bg-white border border-bdr rounded-lg text-ink placeholder-ink-subtle text-[0.9rem] outline-none focus:border-ink focus:ring-2 focus:ring-sage-bright/30 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors text-[0.8rem] font-medium">
                      {showPassword ? 'Skjul' : 'Vis'}
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-[0.78rem] font-semibold text-ink mb-1.5">Bekreft passord</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Gjenta passordet" required minLength={6}
                    className="w-full px-3.5 py-2.5 bg-white border border-bdr rounded-lg text-ink placeholder-ink-subtle text-[0.9rem] outline-none focus:border-ink focus:ring-2 focus:ring-sage-bright/30 transition-all" />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-3 mb-1">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: password.length >= i * 3
                              ? password.length >= 12 ? '#22C55E' : password.length >= 8 ? '#10B981' : '#FBBF24'
                              : '#E5E7EB'
                          }} />
                      ))}
                    </div>
                    <span className="text-[0.72rem] text-ink-muted">
                      {password.length < 6 ? 'For kort' : password.length < 8 ? 'Ok' : password.length < 12 ? 'Bra' : 'Sterkt'}
                    </span>
                  </div>
                )}

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <p className={`text-[0.78rem] mt-2 font-medium ${password === confirmPassword ? 'text-sage sage-accent' : 'text-[#C83A2E]'}`}>
                    {password === confirmPassword ? '✓ Passordene stemmer overens' : '✕ Passordene stemmer ikke overens'}
                  </p>
                )}

                <button type="submit" disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="w-full mt-6 py-3 rounded-lg font-semibold text-[0.95rem] text-white bg-ink hover:bg-ink-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Oppdaterer...
                    </span>
                  ) : 'Oppdater passord'}
                </button>

                <button type="button" onClick={() => navigate('/login')}
                  className="w-full mt-3 py-2.5 rounded-lg text-[0.88rem] text-ink-muted hover:text-ink transition-colors flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Tilbake til innlogging
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
