-- ============================================================================
-- Better Auth schema — session 1 of 5
-- ============================================================================
-- Creates the tables Better Auth manages itself:
--   user, session, account, verification        (core)
--   organization, member, invitation            (organization plugin)
--
-- Run this in Supabase SQL Editor BEFORE the user-migration script. It is
-- idempotent — safe to re-run.
--
-- IMPORTANT: This does NOT remove the existing Supabase auth.users table or
-- the existing workspaces/workspace_members/workspace_invites tables. Those
-- remain the source of truth until the cutover session.
-- ============================================================================

-- ---- Core tables ----------------------------------------------------------
create table if not exists public."user" (
  id             text primary key,
  name           text,
  email          text unique not null,
  email_verified boolean default false not null,
  image          text,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

create table if not exists public.session (
  id             text primary key,
  user_id        text not null references public."user"(id) on delete cascade,
  token          text unique not null,
  expires_at     timestamptz not null,
  ip_address     text,
  user_agent     text,
  -- Organization plugin tracks the "active" org for the session here.
  active_organization_id text,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);
create index if not exists idx_session_user on public.session(user_id);
create index if not exists idx_session_token on public.session(token);

create table if not exists public.account (
  id                         text primary key,
  account_id                 text not null,
  provider_id                text not null,
  user_id                    text not null references public."user"(id) on delete cascade,
  access_token               text,
  refresh_token              text,
  id_token                   text,
  access_token_expires_at    timestamptz,
  refresh_token_expires_at   timestamptz,
  scope                      text,
  password                   text,
  created_at                 timestamptz default now() not null,
  updated_at                 timestamptz default now() not null
);
create index if not exists idx_account_user on public.account(user_id);
create unique index if not exists uq_account_provider_account
  on public.account(provider_id, account_id);

create table if not exists public.verification (
  id          text primary key,
  identifier  text not null,
  value       text not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);
create index if not exists idx_verification_identifier on public.verification(identifier);

-- ---- Organization plugin --------------------------------------------------
create table if not exists public.organization (
  id         text primary key,
  name       text not null,
  slug       text unique,
  logo       text,
  metadata   text,
  created_at timestamptz default now() not null
);

create table if not exists public.member (
  id              text primary key,
  organization_id text not null references public.organization(id) on delete cascade,
  user_id         text not null references public."user"(id)         on delete cascade,
  role            text not null default 'member',
  created_at      timestamptz default now() not null,
  unique (organization_id, user_id)
);
create index if not exists idx_member_user on public.member(user_id);
create index if not exists idx_member_org  on public.member(organization_id);

create table if not exists public.invitation (
  id              text primary key,
  organization_id text not null references public.organization(id) on delete cascade,
  email           text not null,
  role            text not null default 'member',
  status          text not null default 'pending',
  expires_at      timestamptz not null,
  inviter_id      text references public."user"(id) on delete set null,
  created_at      timestamptz default now() not null
);
create index if not exists idx_invitation_email on public.invitation(email);
create index if not exists idx_invitation_org   on public.invitation(organization_id);

-- ---- Access for Better Auth -----------------------------------------------
-- Better Auth connects with the role embedded in DATABASE_URL (typically
-- postgres). That role needs full access to its tables. We don't enable RLS
-- on these tables — Better Auth enforces access at the application layer.
-- Once the existing app is off Supabase Auth, we'll revisit whether to
-- expose any of these via PostgREST; for now they're for Better Auth only.

-- Sanity check — run after this migration:
--   select table_name from information_schema.tables
--   where table_schema='public'
--     and table_name in ('user','session','account','verification',
--                        'organization','member','invitation')
--   order by table_name;
-- Expect 7 rows.
