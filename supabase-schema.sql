-- ============================================
-- LeadFlow Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Profiles table (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  email text,
  phone text,
  plan text default 'starter' check (plan in ('starter', 'pro', 'enterprise')),
  leads_used_this_month integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Users can only read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, company_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. ICP Profiles
create table if not exists public.icp_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text,
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

create policy "Users can CRUD own ICP"
  on public.icp_profiles for all
  using (auth.uid() = user_id);


-- 3. Saved Searches
create table if not exists public.saved_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  filters jsonb not null default '{}',
  result_count integer default 0,
  created_at timestamptz default now()
);

alter table public.saved_searches enable row level security;

create policy "Users can CRUD own searches"
  on public.saved_searches for all
  using (auth.uid() = user_id);


-- 4. Email Templates
create table if not exists public.email_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Untitled Template',
  subject text,
  body text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.email_templates enable row level security;

create policy "Users can CRUD own templates"
  on public.email_templates for all
  using (auth.uid() = user_id);


-- 5. Saved Leads (individual companies saved by user)
create table if not exists public.saved_leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  search_id uuid references public.saved_searches(id) on delete set null,
  org_number text not null,
  company_name text,
  industry text,
  contact_name text,
  contact_role text,
  email text,
  phone text,
  municipality text,
  employees integer,
  revenue text,
  created_at timestamptz default now()
);

alter table public.saved_leads enable row level security;

create policy "Users can CRUD own leads"
  on public.saved_leads for all
  using (auth.uid() = user_id);

-- Index for fast lookups
create index if not exists idx_saved_leads_user on public.saved_leads(user_id);
create index if not exists idx_saved_leads_org on public.saved_leads(org_number);
