-- ============================================================================
-- Migration: workspace API keys for inbound lead ingestion
-- ============================================================================
-- Adds a per-workspace API key used by the /api/leads endpoint to authenticate
-- lead submissions from external landing pages. The key is a prefixed hex
-- string (vks_<48 hex chars>) so it's visually identifiable in logs.
--
-- Run this in Supabase SQL Editor.
-- ============================================================================

alter table public.workspaces
  add column if not exists api_key text unique;

-- Auto-generate an API key for each new workspace
create or replace function public.generate_workspace_api_key()
returns trigger
language plpgsql
as $$
begin
  if new.api_key is null then
    new.api_key := 'vks_' || encode(gen_random_bytes(24), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists workspaces_set_api_key on public.workspaces;
create trigger workspaces_set_api_key
  before insert on public.workspaces
  for each row execute procedure public.generate_workspace_api_key();

-- Backfill existing workspaces
update public.workspaces
  set api_key = 'vks_' || encode(gen_random_bytes(24), 'hex')
  where api_key is null;

-- The "Members can view their workspaces" RLS policy lets any workspace member
-- read the api_key. For a small team that's acceptable (anyone who can send
-- emails from the workspace can also receive inbound form submissions).
-- If you later want to restrict api_key visibility to owners/admins only,
-- replace the workspaces SELECT policy with a view that conditionally hides
-- the column based on workspace_role().

-- Helper: rotate a workspace's API key (owner/admin only, enforced via RLS)
create or replace function public.rotate_workspace_api_key(ws_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_key text;
  caller_role text;
begin
  caller_role := public.workspace_role(ws_id);
  if caller_role not in ('owner','admin') then
    raise exception 'forbidden';
  end if;
  new_key := 'vks_' || encode(gen_random_bytes(24), 'hex');
  update public.workspaces set api_key = new_key, updated_at = now() where id = ws_id;
  return new_key;
end;
$$;

grant execute on function public.rotate_workspace_api_key(uuid) to authenticated;
