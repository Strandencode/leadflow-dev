import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CheckCircle2, AlertTriangle, Loader2, LogIn } from 'lucide-react'

/**
 * /invite/:token
 *
 * Flow:
 *   1. Read the token from the URL
 *   2. Look up the invite (public SELECT policy — no auth required) to show
 *      workspace name + invited email
 *   3. If user is not signed in, prompt them to click the magic link in email
 *      (the same link dropped them here, so the session should already exist;
 *       this branch is for edge cases where the magic link expired)
 *   4. If signed in, call accept_workspace_invite RPC and navigate to dashboard
 */
export default function InviteAcceptPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading, refreshProfile } = useAuth()

  const [invite, setInvite] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [status, setStatus] = useState('loading') // loading | needs_auth | accepting | accepted | error
  const [errorMsg, setErrorMsg] = useState('')

  // 1. Load invite metadata (public policy allows anon reads by token)
  useEffect(() => {
    if (!token || !isSupabaseConfigured()) return
    ;(async () => {
      const { data, error } = await supabase
        .from('workspace_invites')
        .select('id, email, name, role, workspace_id, accepted_at, expires_at')
        .eq('token', token)
        .maybeSingle()
      if (error || !data) {
        setStatus('error')
        setErrorMsg('Fant ikke invitasjonen. Den kan ha blitt slettet.')
        return
      }
      setInvite(data)
      if (data.accepted_at) {
        setStatus('error')
        setErrorMsg('Denne invitasjonen er allerede akseptert.')
        return
      }
      if (new Date(data.expires_at) < new Date()) {
        setStatus('error')
        setErrorMsg('Denne invitasjonen er utløpt. Be om en ny.')
        return
      }
      // Fetch workspace name for display
      const { data: ws } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', data.workspace_id)
        .maybeSingle()
      setWorkspace(ws)
    })()
  }, [token])

  // 2. Once auth resolves, kick off accept flow if invite is valid and user is signed in
  useEffect(() => {
    if (authLoading || !invite || status !== 'loading') return
    if (!user) {
      setStatus('needs_auth')
      return
    }
    ;(async () => {
      setStatus('accepting')
      const { data, error } = await supabase.rpc('accept_workspace_invite', { invite_token: token })
      if (error) {
        setStatus('error')
        setErrorMsg(error.message)
        return
      }
      if (data?.error) {
        setStatus('error')
        setErrorMsg(readableError(data.error))
        return
      }
      // Switch user's default workspace to the one they just joined
      if (data?.workspace_id) {
        await supabase
          .from('profiles')
          .update({ default_workspace_id: data.workspace_id })
          .eq('id', user.id)
      }
      if (refreshProfile) await refreshProfile()
      setStatus('accepted')
      setTimeout(() => navigate('/dashboard'), 1500)
    })()
  }, [authLoading, user, invite, status, token, navigate, refreshProfile])

  return (
    <div className="min-h-screen bg-canvas-warm flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-bdr shadow-sm p-8">
        <div className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center mb-5">
          <span className="font-display text-white text-lg font-semibold">L</span>
        </div>

        {status === 'loading' && (
          <div className="flex items-center gap-2.5 text-ink-muted text-sm">
            <Loader2 size={16} className="animate-spin" /> Henter invitasjon…
          </div>
        )}

        {status === 'needs_auth' && invite && (
          <>
            <h1 className="font-display text-[1.4rem] font-semibold text-ink mb-1">
              Du er invitert til {workspace?.name || 'et workspace'}
            </h1>
            <p className="text-ink-muted text-sm mb-5">
              Invitasjonen ble sendt til <span className="font-medium text-ink">{invite.email}</span>.
              Logg inn med samme e-post for å akseptere.
            </p>
            <Link
              to={`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-lg text-sm font-medium hover:bg-ink-soft"
            >
              <LogIn size={15} /> Logg inn for å akseptere
            </Link>
          </>
        )}

        {status === 'accepting' && (
          <div className="flex items-center gap-2.5 text-ink-muted text-sm">
            <Loader2 size={16} className="animate-spin" /> Legger deg til i {workspace?.name || 'workspace'}…
          </div>
        )}

        {status === 'accepted' && (
          <>
            <div className="flex items-center gap-2.5 text-sage sage-accent mb-2">
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">Velkommen til {workspace?.name || 'workspacet'}!</span>
            </div>
            <p className="text-ink-muted text-sm">Tar deg til dashboardet…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex items-center gap-2.5 text-[#C83A2E] mb-2">
              <AlertTriangle size={18} />
              <span className="text-sm font-medium">Noe gikk galt</span>
            </div>
            <p className="text-ink-muted text-sm mb-4">{errorMsg}</p>
            <Link to="/" className="text-ink text-sm font-medium hover:underline">
              Tilbake til forsiden
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function readableError(code) {
  switch (code) {
    case 'not_authenticated': return 'Du må være innlogget.'
    case 'invite_not_found': return 'Fant ikke invitasjonen.'
    case 'already_accepted': return 'Denne invitasjonen er allerede akseptert.'
    case 'expired': return 'Invitasjonen er utløpt.'
    default: return code
  }
}
