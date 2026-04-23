-- ============================================================================
-- Better Auth backfill — session 1 of 5
-- ============================================================================
-- Mirrors existing Supabase data into the Better Auth-managed tables with
-- matching IDs so foreign-key references stay stable during the staged cutover.
--
-- Run this AFTER supabase-migration-better-auth-schema.sql.
--
-- One-shot copy — no ongoing sync. Session 2 decides whether to add triggers
-- for continuous sync or switch entirely to Better Auth writes.
-- ============================================================================

-- ---- user -----------------------------------------------------------------
-- Copy every existing Supabase auth user.
-- email_verified reflects whether they clicked the magic link in the past.
insert into public."user" (id, email, email_verified, name, image, created_at, updated_at)
select
  u.id::text,
  u.email,
  u.email_confirmed_at is not null,
  coalesce(
    p.full_name,
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ),
  u.raw_user_meta_data->>'avatar_url',
  u.created_at,
  coalesce(u.updated_at, u.created_at)
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (id) do nothing;

-- ---- account (password credentials) ---------------------------------------
-- Supabase stores bcrypt hashes in auth.users.encrypted_password. Better
-- Auth's bcrypt verifier is compatible with the $2a$ / $2b$ formats Supabase
-- emits, so copying the hash directly lets existing users log in on the new
-- stack without a password reset.
--
-- If a user never set a password (OAuth-only, magic-link-only), they won't
-- have an encrypted_password row — those users will need to re-auth through
-- a passwordless flow when we cut over.
insert into public.account (
  id, account_id, provider_id, user_id, password, created_at, updated_at
)
select
  'bc_' || encode(gen_random_bytes(12), 'hex'),  -- stable, non-guessable id
  u.id::text,
  'credential',
  u.id::text,
  u.encrypted_password,
  u.created_at,
  coalesce(u.updated_at, u.created_at)
from auth.users u
where u.encrypted_password is not null
on conflict (provider_id, account_id) do nothing;

-- ---- organization (from workspaces) --------------------------------------
-- Keep the same IDs so every workspace_id FK elsewhere still resolves.
insert into public.organization (id, name, slug, metadata, created_at)
select
  w.id::text,
  w.name,
  -- Slug: lowercase ascii-ish fallback from name, then from id tail if empty.
  coalesce(
    nullif(lower(regexp_replace(w.name, '[^a-zA-Z0-9]+', '-', 'g')), ''),
    'org-' || substr(w.id::text, 1, 8)
  ),
  jsonb_build_object(
    'plan', w.plan,
    'trial_started_at', w.trial_started_at,
    'api_key', w.api_key
  )::text,
  w.created_at
from public.workspaces w
on conflict (id) do nothing;

-- ---- member (from workspace_members) -------------------------------------
insert into public.member (id, organization_id, user_id, role, created_at)
select
  'mb_' || encode(gen_random_bytes(12), 'hex'),
  wm.workspace_id::text,
  wm.user_id::text,
  wm.role,
  wm.joined_at
from public.workspace_members wm
on conflict (organization_id, user_id) do nothing;

-- ---- invitation (from workspace_invites, only still-valid ones) ----------
insert into public.invitation (
  id, organization_id, email, role, status, expires_at, inviter_id, created_at
)
select
  wi.id::text,
  wi.workspace_id::text,
  wi.email,
  wi.role,
  case
    when wi.accepted_at is not null then 'accepted'
    when wi.expires_at  < now()     then 'expired'
    else                                 'pending'
  end,
  wi.expires_at,
  wi.invited_by::text,
  wi.invited_at
from public.workspace_invites wi
on conflict (id) do nothing;

-- ---- Sanity check ---------------------------------------------------------
-- Run these after the backfill — the counts on left should equal the counts
-- on right, minus any rows already present before this ran:
--
--   select 'auth.users',         count(*) from auth.users
--   union all select 'user',     count(*) from public."user"
--   union all select 'account',  count(*) from public.account
--   union all select 'workspaces', count(*) from public.workspaces
--   union all select 'organization', count(*) from public.organization
--   union all select 'workspace_members', count(*) from public.workspace_members
--   union all select 'member',   count(*) from public.member
--   union all select 'workspace_invites', count(*) from public.workspace_invites
--   union all select 'invitation', count(*) from public.invitation;
