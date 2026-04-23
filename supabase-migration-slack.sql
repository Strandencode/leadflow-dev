-- ============================================================================
-- Migration: Slack integration per workspace
-- ============================================================================
-- Adds a webhook URL + event-selection column to workspaces, and a trigger
-- that fires the webhook via pg_net whenever a new pipeline_item enters the
-- "new" stage (i.e. a new lead card).
--
-- Run this AFTER supabase-migration-api-keys.sql.
-- ============================================================================

-- pg_net is pre-installed on Supabase. Ensure it's enabled.
create extension if not exists pg_net with schema extensions;

alter table public.workspaces
  add column if not exists slack_webhook_url text,
  add column if not exists slack_events      text[] default '{}';

-- ---- Webhook trigger ------------------------------------------------------
create or replace function public.fire_slack_on_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  webhook_url text;
  events      text[];
  display     text;
  payload     jsonb;
begin
  -- Only fire when the row lands in the "new" stage (newly-created lead)
  if new.stage_id <> 'new' then return new; end if;

  select slack_webhook_url, coalesce(slack_events, '{}')
    into webhook_url, events
    from public.workspaces
    where id = new.workspace_id;

  if webhook_url is null or webhook_url = '' then return new; end if;
  if not ('new_lead' = any (events))          then return new; end if;

  display := coalesce(new.contact_name, new.name, new.email, 'Ukjent');

  payload := jsonb_build_object(
    'text',
    format('🌱 Ny lead i Vekstor: %s', display),
    'blocks', jsonb_build_array(
      jsonb_build_object(
        'type', 'header',
        'text', jsonb_build_object('type', 'plain_text', 'text', '🌱 Ny lead')
      ),
      jsonb_build_object(
        'type', 'section',
        'fields', jsonb_build_array(
          jsonb_build_object('type','mrkdwn','text', format('*Kontakt*%s%s', E'\n', display)),
          jsonb_build_object('type','mrkdwn','text', format('*Selskap*%s%s', E'\n', coalesce(new.name, '—'))),
          jsonb_build_object('type','mrkdwn','text', format('*E-post*%s%s',  E'\n', coalesce(new.email, '—'))),
          jsonb_build_object('type','mrkdwn','text', format('*Telefon*%s%s', E'\n', coalesce(new.phone, '—')))
        )
      ),
      jsonb_build_object(
        'type', 'context',
        'elements', jsonb_build_array(
          jsonb_build_object(
            'type','mrkdwn',
            'text', format('Org.nr: `%s` • Stage: *Ny Lead* • <https://app.vekstor.no/pipeline|Åpne i Vekstor>',
                           new.org_number)
          )
        )
      )
    )
  );

  perform net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object('Content-Type','application/json'),
    body    := payload
  );
  return new;
exception when others then
  -- Never let webhook failures break the lead insert
  raise warning 'fire_slack_on_new_lead failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists pipeline_items_slack_fire on public.pipeline_items;
create trigger pipeline_items_slack_fire
  after insert on public.pipeline_items
  for each row execute procedure public.fire_slack_on_new_lead();

-- Optional: also fire on UPDATE when a card transitions INTO 'new' (rare).
drop trigger if exists pipeline_items_slack_fire_upd on public.pipeline_items;
create trigger pipeline_items_slack_fire_upd
  after update of stage_id on public.pipeline_items
  for each row
  when (old.stage_id is distinct from new.stage_id and new.stage_id = 'new')
  execute procedure public.fire_slack_on_new_lead();
