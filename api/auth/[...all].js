/**
 * Vercel catch-all for /api/auth/*
 *
 * Forwards every path Better Auth owns (/api/auth/sign-in,
 * /api/auth/callback/google, /api/auth/organization/..., …) to the shared
 * `auth` instance. This endpoint replaces what Next.js App Router users
 * would put under `app/api/auth/[...all]/route.ts`.
 *
 * SESSION 1 NOTE: Reachable in production once DATABASE_URL is set in
 * Vercel env, but no client code calls these endpoints yet — verify via
 * `curl https://app.vekstor.no/api/auth/get-session` and similar.
 */
import { auth } from '../../lib/auth.js'
import { toNodeHandler } from 'better-auth/node'

export const config = {
  // Better Auth handlers stream responses; keep maxDuration short.
  maxDuration: 10,
  // Opt out of Vercel's automatic body parsing — Better Auth reads the
  // raw request body itself.
  api: { bodyParser: false },
}

export default toNodeHandler(auth.handler)
