-- =============================================================================
-- Migration 0020: daily lead-follow-up digest — pg_cron + pg_net
-- PRODUCT_SPEC.md sections 2/11 (task 41/42). Run after 0019.
--
-- Schedules a daily call to `POST /v1/internal/cron/daily-digest` (apps/api),
-- which does the actual work (query overdue leads, group by agent, send via
-- SNDR) — this migration only owns the schedule + the HTTP trigger, exactly
-- like the rest of this project's "SQL does data/policy, `api` does business
-- logic" split.
--
-- Two custom Postgres settings this migration reads but does NOT set (never
-- put secrets/environment-specific values in a versioned migration):
--   app.settings.cron_secret     — must equal INTERNAL_CRON_SECRET (api's
--                                   env var). Run once, manually, in the
--                                   Supabase SQL editor:
--                                     alter database postgres
--                                       set app.settings.cron_secret = '<same value as INTERNAL_CRON_SECRET>';
--   app.settings.api_base_url    — optional; defaults to this project's
--                                   confirmed production api URL below.
--                                   Override the same way if that ever
--                                   changes or a second (staging) project
--                                   needs a different target:
--                                     alter database postgres
--                                       set app.settings.api_base_url = 'https://...';
-- Either setting requires reconnecting (or a role/session restart) to take
-- effect — matches Supabase's own documented pattern for custom GUCs.
--
-- ⚠️ UNTESTED against real pg_net locally, unlike the cron.schedule() call
-- below (verified against a real pg_cron install — see task 41/42's
-- report). pg_net is Supabase-proprietary infrastructure, not part of a
-- vanilla Postgres install (same category of gap already documented in
-- migrations 0011/0014 for the `storage` schema) — net.http_post's call
-- shape here matches Supabase's own published cron+webhook pattern exactly,
-- but needs a live smoke test once this runs against a real Supabase
-- project (confirm a row appears in `net._http_response` after the first
-- scheduled fire, or trigger it early with `select cron.schedule_in_seconds(...)`
-- style testing, or just call `select net.http_post(...)` by hand once).
-- =============================================================================

-- Both extensions are non-relocatable (they own a fixed schema — `cron`
-- and `net` respectively) — no `with schema` clause; Supabase's own docs
-- enable them the same plain way.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent: re-running this migration (or a manual re-apply) replaces
-- the existing job by name instead of erroring or duplicating it.
select cron.unschedule(jobid) from cron.job where jobname = 'daily-lead-followup-digest';

select cron.schedule(
  'daily-lead-followup-digest',
  '0 3 * * *', -- 03:00 UTC = 06:00 Riyadh (KSA is UTC+3 year-round, no DST)
  $$
  select net.http_post(
    url := coalesce(current_setting('app.settings.api_base_url', true), 'https://sbaahapi-production.up.railway.app')
      || '/v1/internal/cron/daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Cron-Secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
