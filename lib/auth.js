/**
 * Better Auth — server-side configuration.
 *
 * SESSION 1 NOTE: This file exists but no runtime code imports it yet. It's
 * mounted at /api/auth/[...all] so Better Auth's endpoints are reachable for
 * testing, but the React app still uses Supabase Auth (src/hooks/useAuth.jsx).
 * See BETTER-AUTH-MIGRATION.md for the staged cutover plan.
 *
 * Server-only. Must not be imported from src/ (client bundle).
 */
import { betterAuth } from 'better-auth'
import { organization } from 'better-auth/plugins'
import { Pool } from 'pg'

const required = (name) => {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

// Reuse a single Pool across warm Vercel invocations to avoid exhausting
// Supabase's connection limit during traffic bursts.
let _pool = null
function pool() {
  if (_pool) return _pool
  _pool = new Pool({
    connectionString: required('DATABASE_URL'),
    // Supabase connection poolers handle keep-alive; keep client-side pool small.
    max: 5,
    ssl: { rejectUnauthorized: false },
  })
  return _pool
}

export const auth = betterAuth({
  // Direct Postgres access to the Supabase database. Better Auth manages
  // its own tables (user, session, account, verification, organization,
  // member, invitation). Existing Supabase auth.users is the source of
  // truth until the cutover session — see migration SQL for the backfill.
  database: pool(),

  secret:  required('BETTER_AUTH_SECRET'),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5173',

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,   // matches the security findings — no autoconfirm
    minPasswordLength: 10,
    // TODO session 2: wire up the actual email sender for reset + verify.
    // sendResetPassword: async ({ user, url }) => { ... }
  },

  // Vekstor workspaces map cleanly onto Better Auth organizations:
  //   workspaces              → organization
  //   workspace_members       → member
  //   workspace_invites       → invitation
  // The backfill SQL copies rows with matching IDs so existing references
  // (saved_lists.workspace_id, etc.) continue to resolve.
  plugins: [
    organization({
      // Cap per current business rules — enterprise is unlimited; free is 3.
      // This is just Better Auth's soft limit; hard caps stay in our own
      // usage_counters / plan logic.
      allowUserToCreateOrganization: true,
      organizationLimit:             10,
      invitationExpiresIn:           60 * 60 * 24 * 14,  // 14 days, matches existing
    }),
  ],

  // Cookies — default same-origin, httpOnly, secure in production.
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})

/** Convenience for tests / one-off scripts: graceful shutdown of the pool. */
export async function closeAuth() {
  if (_pool) await _pool.end()
}
