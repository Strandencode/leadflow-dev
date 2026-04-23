/**
 * Better Auth — React client.
 *
 * SESSION 1 NOTE: Not imported anywhere yet. Added for session 2 where the
 * login / signup / invite-accept pages get flipped to Better Auth. Until
 * then, keep using `useAuth` from `src/hooks/useAuth.jsx` (Supabase Auth).
 */
import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  // Same-origin by default. For cross-subdomain deploys, set VITE_AUTH_URL
  // in the Vercel env (e.g. https://auth.vekstor.no) and the catch-all
  // handler will live there.
  baseURL: import.meta.env.VITE_AUTH_URL || '/api/auth',

  plugins: [organizationClient()],
})

// Re-export the hooks the React code will use once we flip surfaces.
// Keeping them named up front makes the session 2 diffs smaller.
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  forgetPassword,
  resetPassword,
  sendVerificationEmail,
  organization,   // { create, list, setActive, inviteMember, acceptInvitation, ... }
} = authClient
