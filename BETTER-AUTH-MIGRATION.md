# Better Auth Migration

Staged migration from Supabase Auth to [Better Auth](https://better-auth.com).
Supabase remains the database, the Postgres schema, and the RLS engine for
non-auth tables. Only the authentication layer moves.

**Current status: Session 1 complete — infrastructure scaffolded, not yet live.**

---

## Why staged

The app has real users in real workspaces. A big-bang cutover risks:

- Locking everyone out if Better Auth cookies don't round-trip correctly
- Breaking RLS on `saved_lists`, `pipeline_items`, `customers`, etc. —
  every policy calls `auth.uid()` which is a Supabase JWT claim
- Losing password hashes if the bcrypt format doesn't carry over cleanly
- Breaking the invite flow mid-acceptance

So we cut over one surface at a time, keeping Supabase Auth as a working
fallback until every surface is verified on the new stack.

---

## Architecture target

```
                 ┌──────────────────────────────────────────────┐
                 │                                              │
                 │     React SPA (Vite)                         │
                 │                                              │
                 │   ┌─────────────────┐       ┌─────────────┐  │
                 │   │ auth-client.js  │─────▶ │  Cookies    │  │
                 │   │ (Better Auth)   │       │ (httpOnly)  │  │
                 │   └────────┬────────┘       └─────────────┘  │
                 │            │                                 │
                 └────────────┼─────────────────────────────────┘
                              │
                              ▼
                 ┌──────────────────────────────────────────────┐
                 │ Vercel                                       │
                 │   /api/auth/[...all]  →  better-auth/node    │
                 │   /api/leads          →  existing            │
                 └────────────┬─────────────────────────────────┘
                              │
                              ▼
                 ┌──────────────────────────────────────────────┐
                 │ Supabase Postgres                            │
                 │                                              │
                 │  Better Auth owns:                           │
                 │    user, session, account, verification      │
                 │    organization, member, invitation          │
                 │                                              │
                 │  Vekstor owns (unchanged IDs):               │
                 │    profiles, saved_lists, pipeline_items,    │
                 │    customers, email_templates, icp_profiles, │
                 │    usage_counters, contact_tracking          │
                 │                                              │
                 │  RLS policies rewritten to trust a custom    │
                 │  JWT claim from Better Auth                  │
                 └──────────────────────────────────────────────┘
```

---

## Sessions

### ✅ Session 1 — Infrastructure (this commit)

Additive only. Nothing in the running app changes behavior.

- `lib/auth.js` — server config with `emailAndPassword` + `organization` plugin
- `src/lib/auth-client.js` — React client (not yet imported anywhere)
- `api/auth/[...all].js` — Vercel catch-all handler
- `supabase-migration-better-auth-schema.sql` — creates `user`, `session`,
  `account`, `verification`, `organization`, `member`, `invitation`
- `supabase-migration-better-auth-backfill.sql` — mirrors existing
  `auth.users` / `workspaces` / `workspace_members` / `workspace_invites`
  into the new tables with **matching IDs** so FKs stay stable
- `.env` — `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`
- `package.json` — `better-auth`, `pg`

#### What to verify before moving on

1. Run both migration SQL files in Supabase SQL Editor.
2. Set `DATABASE_URL` in Vercel env (Session pooler connection string with
   the DB password).
3. Deploy, then check:
   ```
   curl https://app.vekstor.no/api/auth/ok         # should 200
   curl https://app.vekstor.no/api/auth/get-session # should 200 {} when not signed in
   ```
4. Confirm row counts in the sanity-check query at the end of the backfill
   SQL — old and new tables should match.

### Session 2 — Password reset (lowest-risk surface)

- Replace `ResetPasswordPage.jsx` with a Better Auth flow
  (`authClient.forgetPassword` + `authClient.resetPassword`)
- Wire up `sendResetPassword` in `lib/auth.js` to actually send email
  (Resend / SendGrid / Supabase SMTP)
- Verify: existing Supabase users can reset password via either flow
  (Supabase's still works, Better Auth's also works)
- Rollback trigger: any hash mismatch between Supabase's bcrypt and Better
  Auth's verifier → investigate and patch `password.verify` config

### Session 3 — Signup & email verification

- Replace the signup tab on `LoginPage.jsx` with `authClient.signUp.email`
- Enable `requireEmailVerification` in the config (already set in `lib/auth.js`)
- Write `sendVerificationEmail` hook
- Disable Supabase Auth signup in parallel (toggle in Supabase dashboard)
- At this point: all NEW users live in Better Auth only
- Existing Supabase users still work via Session 4

### Session 4 — Sign-in cutover

- Replace the login form on `LoginPage.jsx` with `authClient.signIn.email`
- Replace `useAuth.jsx` with a Better Auth session hook
- **Rewrite RLS policies** on all tenant tables — this is the critical step.
  Two approaches:
  - **Approach A (recommended)**: Set up a custom Postgres JWT auth in
    Supabase pointing at Better Auth's signing secret. `auth.uid()` in RLS
    resolves against Better Auth sessions. Most policies need no changes.
  - **Approach B**: Drop RLS on public tables and enforce authorization in
    application code. Simpler but loses defense-in-depth.
- Retire `src/hooks/useAuth.jsx`
- Retire direct usage of `supabase.auth.*` throughout the app
- Keep Supabase client around only for DB queries (anon/RLS mode)

### Session 5 — Invitations

- Replace the invite flow with Better Auth's `organization.inviteMember`
  and `organization.acceptInvitation`
- Rewrite `InviteAcceptPage.jsx` to use `authClient.organization.acceptInvitation`
- Deprecate the `accept_workspace_invite` RPC once no caller remains
- Fix the security findings inherent to the old invite flow (no email
  match check, public read policy) — Better Auth handles both natively

### Session 6 — Cleanup

- Delete `workspaces`, `workspace_members`, `workspace_invites` once no app
  code references them (or keep them as views on the new `organization`
  tables for PostgREST compatibility)
- Delete `src/hooks/useAuth.jsx`
- Remove `supabase.auth.*` from the bundle
- Update the security-findings ledger — items #1, #4, #5 should all be
  resolved by Better Auth's defaults

---

## Known unknowns to validate in Session 2

- **bcrypt compatibility**. Better Auth's default password verifier uses
  `scrypt` now in some versions. The backfill SQL assumes we'll configure
  Better Auth to use `bcrypt` via custom `password.hash` / `password.verify`
  hooks so existing Supabase hashes round-trip. If that config doesn't
  exist in the version we're on, existing users get emailed a one-time
  reset link and re-set their password.
- **Cookie handling across Vercel functions vs static SPA**. Verify that
  `/api/auth/*` sets `Set-Cookie: SameSite=Lax` and `Secure` in prod and
  that `document.cookie` reads it on subsequent requests.
- **Organization plugin defaults** may not match our workspace role names.
  We currently use `owner | admin | member`; Better Auth's default roles
  are `owner | admin | member` too — good — but verify the `role` text
  column accepts our values as-is.

---

## Rollback

Every session leaves Supabase Auth functional. If a cutover step goes
wrong, revert the client-side file (login page, useAuth hook, etc.) — the
database and server-side Better Auth handler stay in place but simply
stop being called.

The point of no return is **Session 4**: once RLS is rewritten to use
Better Auth claims, reverting to Supabase Auth requires rolling the RLS
back too. Plan that cutover carefully.
