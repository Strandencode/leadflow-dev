import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'

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
    <div className="min-h-screen bg-ink flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 hero-grid" />
      <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] orb-1"
        style={{ background: 'radial-gradient(circle, #7C5CFC, transparent 70%)' }} />
      <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] orb-2"
        style={{ background: 'radial-gradient(circle, #FF6B4A, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[420px] px-6">
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
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 glass-dark">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' }}>
                <Check size={32} className="text-green-400" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Passord oppdatert!</h2>
              <p className="text-white/40 text-[0.9rem] mb-6 leading-relaxed">
                Passordet ditt er nå endret. Du kan logge inn med det nye passordet.
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full py-3.5 rounded-xl font-semibold text-base text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8F6B 100%)' }}>
                Gå til innlogging
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-semibold mb-2">Velg nytt passord</h2>
              <p className="text-white/40 text-[0.88rem] mb-6">
                Skriv inn ditt nye passord nedenfor.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">Nytt passord</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Minst 6 tegn" required minLength={6} autoFocus
                      className="w-full px-4 py-3 pr-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/10 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors text-[0.8rem]">
                      {showPassword ? 'Skjul' : 'Vis'}
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-[0.78rem] font-medium text-white/30 mb-1.5 uppercase tracking-wider">Bekreft passord</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Gjenta passordet" required minLength={6}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-white/15 text-[0.95rem] outline-none focus:border-violet/50 focus:ring-2 focus:ring-violet/10 transition-all" />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mt-3 mb-1">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{
                            background: password.length >= i * 3
                              ? password.length >= 12 ? '#22C55E' : password.length >= 8 ? '#FF6B4A' : '#FBBF24'
                              : 'rgba(255,255,255,0.06)'
                          }} />
                      ))}
                    </div>
                    <span className="text-[0.72rem] text-white/25">
                      {password.length < 6 ? 'For kort' : password.length < 8 ? 'Ok' : password.length < 12 ? 'Bra' : 'Sterkt'}
                    </span>
                  </div>
                )}

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <p className={`text-[0.78rem] mt-2 ${password === confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    {password === confirmPassword ? '✓ Passordene stemmer overens' : '✕ Passordene stemmer ikke overens'}
                  </p>
                )}

                <button type="submit" disabled={loading || password.length < 6 || password !== confirmPassword}
                  className="w-full mt-6 py-3.5 rounded-xl font-semibold text-base text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7C5CFC 0%, #A78BFA 100%)' }}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Oppdaterer...
                    </span>
                  ) : 'Oppdater passord'}
                </button>

                <button type="button" onClick={() => navigate('/login')}
                  className="w-full mt-3 py-2.5 rounded-xl text-[0.88rem] text-white/30 hover:text-white/60 transition-colors flex items-center justify-center gap-2">
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
