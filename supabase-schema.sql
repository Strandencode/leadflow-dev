-- ============================================================================
-- LeadFlow Database Schema — Workspace Edition
-- ============================================================================
--
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query).
-- Safe to run on a fresh project or to replace the old single-user schema.
-- Existing data WILL be dropped. This is expected — the user chose not to
-- migrate old localStorage data.
--
-- Architecture:
--   - Every user gets a default personal workspace on signup
--   - All shared resources (lists, pipeline, customers, templates, ICP) are
--     scoped to workspace_id and protected by RLS
--   - Members of a workspace see each other's data within that workspace
--   - Invites use a token + Supabase Auth magic link for sign-in
-- ============================================================================

-- ---- Clean slate ----------------------------------------------------------
-- Drop in reverse dependency order. Safe if tables don't exist.
drop table if exists public.contact_tracking cascade;
drop table if exists public.pipeline_notes cascade;
drop table if exists public.pipeline_items cascade;
drop table if exists public.customer_contracts cascade;
drop table if exists public.customer_notes cascade;
drop table if exists public.customers cascade;
drop table if exists public.saved_lists cascade;
drop table if exists public.email_templates cascade;
drop table if exists public.icp_profiles cascade;
drop table if exists public.workspace_invites cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.saved_searches cascade;
drop table if exists public.saved_leads cascade;

drop function if exists public.is_workspace_member(uuid) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.accept_workspace_invite(text) cascade;

-- ---- Profiles (augmented) -------------------------------------------------
-- Re-create profiles cleanly so the plan check constraint matches current code.
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  email text,
  phone text,
  plan text default 'professional' check (plan in ('professional','business','enterprise')),
  default_workspace_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ---- Workspaces -----------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workspaces enable row level security;

-- ---- Workspace members ----------------------------------------------------
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text not null check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  unique (workspace_id, user_id)
);

create index idx_wm_workspace on public.workspace_members(workspace_id);
create index idx_wm_user on public.workspace_members(user_id);

alter table public.workspace_members enable row level security;

-- ---- Helper: is_workspace_member ------------------------------------------
-- SECURITY DEFINER so RLS policies can call it without recursion.
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role(ws_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from public.workspace_members
  where workspace_id = ws_id and user_id = auth.uid()
  limit 1;
$$;

-- ---- Now define RLS for workspaces & members ------------------------------
create policy "Members can view their workspaces" on public.workspaces
  for select using (public.is_workspace_member(id));
create policy "Owner can update workspace" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "Authenticated can create workspace" on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy "Owner can delete workspace" on public.workspaces
  for delete using (owner_id = auth.uid());

create policy "Members view workspace members" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "Owners/admins manage members" on public.workspace_members
  for all using (public.workspace_role(workspace_id) in ('owner','admin'))
  with check (public.workspace_role(workspace_id) in ('owner','admin'));
-- Allow insert of self (used by handle_new_user trigger)
create policy "Users insert self as member" on public.workspace_members
  for insert with check (user_id = auth.uid());

-- ---- Workspace invites ----------------------------------------------------
create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  email text not null,
  name text,
  role text not null check (role in ('admin','member')) default 'member',
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users not null,
  invited_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users
);

create index idx_invites_workspace on public.workspace_invites(workspace_id);
create index idx_invites_email on public.workspace_invites(email);
create index idx_invites_token on public.workspace_invites(token);

alter table public.workspace_invites enable row level security;

create policy "Members view workspace invites" on public.workspace_invites
  for select using (public.is_workspace_member(workspace_id));
create policy "Admins/owners manage invites" on public.workspace_invites
  for all using (public.workspace_role(workspace_id) in ('owner','admin'))
  with check (public.workspace_role(workspace_id) in ('owner','admin'));
-- Allow anon read-by-token for the accept flow (no auth yet)
create policy "Anyone can read invite by token" on public.workspace_invites
  for select using (true);

-- ---- Saved lists ----------------------------------------------------------
create table public.saved_lists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  created_by uuid references auth.users on delete set null,
  name text not null,
  filters jsonb default '{}'::jsonb,
  filter_labels text,
  companies jsonb default '[]'::jsonb,
  total_results integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_lists_workspace on public.saved_lists(workspace_id);

alter table public.saved_lists enable row level security;

create policy "Members CRUD lists" on public.saved_lists
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- Pipeline items (one row per lead per workspace) ----------------------
create table public.pipeline_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  org_number text not null,
  stage_id text not null check (stage_id in ('new','contacted','meeting','contract','won','lost')),
  moved_at timestamptz default now(),
  name text,
  industry text,
  contact_name text,
  email text,
  phone text,
  municipality text,
  notes jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (workspace_id, org_number)
);

create index idx_pipeline_workspace on public.pipeline_items(workspace_id);
create index idx_pipeline_stage on public.pipeline_items(workspace_id, stage_id);

alter table public.pipeline_items enable row level security;

create policy "Members CRUD pipeline" on public.pipeline_items
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- Contact tracking (emailed / called flags per lead per workspace) -----
create table public.contact_tracking (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  org_number text not null,
  emailed boolean default false,
  emailed_at timestamptz,
  called boolean default false,
  called_at timestamptz,
  updated_at timestamptz default now(),
  unique (workspace_id, org_number)
);

create index idx_tracking_workspace on public.contact_tracking(workspace_id);

alter table public.contact_tracking enable row level security;

create policy "Members CRUD tracking" on public.contact_tracking
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- Customers (closed-won) -----------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  org_number text,
  name text not null,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  industry text,
  municipality text,
  revenue bigint,
  notes text,
  status text default 'won',
  won_date timestamptz default now(),
  contracts jsonb default '[]'::jsonb,
  notes_log jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_customers_workspace on public.customers(workspace_id);

alter table public.customers enable row level security;

create policy "Members CRUD customers" on public.customers
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- Email templates ------------------------------------------------------
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null,
  created_by uuid references auth.users on delete set null,
  name text not null default 'Untitled',
  subject text,
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_templates_workspace on public.email_templates(workspace_id);

alter table public.email_templates enable row level security;

create policy "Members CRUD templates" on public.email_templates
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- ICP profiles (one per workspace for now) -----------------------------
create table public.icp_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces on delete cascade not null unique,
  company_name text,
  sender_name text,
  your_industry text,
  what_you_sell text,
  target_industries text,
  company_size text,
  min_revenue text,
  target_region text,
  problem_you_solve text,
  decision_maker_title text,
  decision_maker_dept text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.icp_profiles enable row level security;

create policy "Members CRUD icp" on public.icp_profiles
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- ---- Auto-provision default workspace on signup ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_ws_id uuid;
  display_name text;
  company text;
  invited_ws uuid;
begin
  display_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  company := coalesce(new.raw_user_meta_data->>'company_name', display_name || '''s workspace');

  -- Create profile
  insert into public.profiles (id, full_name, company_name, email)
  values (new.id, display_name, company, new.email);

  -- If the signup came from an invite magic-link, skip auto-creating a personal
  -- workspace — accept_workspace_invite will attach them to the inviting one.
  -- The client sets `invited_to_workspace` in the OTP metadata.
  begin
    invited_ws := (new.raw_user_meta_data->>'invited_to_workspace')::uuid;
  exception when others then
    invited_ws := null;
  end;

  if invited_ws is not null then
    -- Just leave default_workspace_id null for now; accept_workspace_invite sets it
    return new;
  end if;

  -- Normal signup path: create personal workspace
  insert into public.workspaces (name, owner_id)
  values (company, new.id)
  returning id into new_ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_ws_id, new.id, 'owner');

  update public.profiles set default_workspace_id = new_ws_id where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- Accept invite RPC ----------------------------------------------------
-- Client calls this with the token after the user is authenticated.
-- Adds the user to workspace_members and marks invite accepted.
create or replace function public.accept_workspace_invite(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.workspace_invites%rowtype;
  uid uuid := auth.uid();
begin
  if uid is null then
    return jsonb_build_object('error','not_authenticated');
  end if;

  select * into inv from public.workspace_invites where token = invite_token;
  if not found then
    return jsonb_build_object('error','invite_not_found');
  end if;
  if inv.accepted_at is not null then
    return jsonb_build_object('error','already_accepted');
  end if;
  if inv.expires_at < now() then
    return jsonb_build_object('error','expired');
  end if;

  -- Add to members (upsert to avoid conflict if re-invited)
  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, uid, inv.role)
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  update public.workspace_invites
    set accepted_at = now(), accepted_by = uid
    where id = inv.id;

  -- Flip the user's active workspace to the one they just joined.
  -- This also closes the orphan-workspace hole for users who did NOT come
  -- through the invited-signup path (e.g. existing user accepts a second
  -- workspace) — they'll still have their old personal workspace around,
  -- which is intentional since they might have data there.
  update public.profiles
    set default_workspace_id = inv.workspace_id
    where id = uid;

  return jsonb_build_object('success', true, 'workspace_id', inv.workspace_id);
end;
$$;

grant execute on function public.accept_workspace_invite(text) to authenticated;

-- ---- Updated-at triggers (convenience) ------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_workspaces before update on public.workspaces
  for each row execute procedure public.touch_updated_at();
create trigger touch_profiles before update on public.profiles
  for each row execute procedure public.touch_updated_at();
create trigger touch_lists before update on public.saved_lists
  for each row execute procedure public.touch_updated_at();
create trigger touch_pipeline before update on public.pipeline_items
  for each row execute procedure public.touch_updated_at();
create trigger touch_customers before update on public.customers
  for each row execute procedure public.touch_updated_at();
create trigger touch_templates before update on public.email_templates
  for each row execute procedure public.touch_updated_at();
create trigger touch_icp before update on public.icp_profiles
  for each row execute procedure public.touch_updated_at();
create trigger touch_tracking before update on public.contact_tracking
  for each row execute procedure public.touch_updated_at();

-- ---- Done -----------------------------------------------------------------
-- Verify with:
--   select * from public.workspaces;
--   select * from public.workspace_members;
