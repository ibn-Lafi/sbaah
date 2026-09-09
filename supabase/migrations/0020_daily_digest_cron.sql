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
-- Revision note: an earlier version of this migration read the shared
-- secret from a custom Postgres setting (`app.settings.cron_secret`,
-- via `alter database postgres set ...`). Supabase's hosted platform
-- rejects that for project accounts (`ERROR: 42501: permission denied to
-- set parameter`) — ALTER DATABASE SET changes instance-wide config on
-- infrastructure Supabase itself manages, not something a project role is
-- granted. **Supabase Vault** is the sanctioned mechanism for exactly this
-- (a secret pg_cron/pg_net needs at run time) and is pre-installed on
-- every Supabase project — no extension to enable, nothing project-role
-- permissions block.
--
-- One-time manual step this migration does NOT do (never put the real
-- secret in a versioned file): store it in Vault once, in the Supabase
-- SQL editor —
--   select vault.create_secret(
--     '<same value as api's INTERNAL_CRON_SECRET env var>',
--     'internal_cron_secret',
--     'Shared secret for pg_cron -> POST /v1/internal/cron/daily-digest (task 41/42)'
--   );
-- Re-running create_secret with the same name errors (name must be
-- unique) — to rotate the secret later, use `select vault.update_secret(id, new_value)`
-- (look up `id` via `select id from vault.secrets where name = 'internal_cron_secret'`)
-- instead of calling create_secret again.
--
-- The api base URL is NOT a secret, so it's a plain literal below rather
-- than another moving piece — update it directly in a new migration if it
-- ever changes.
--
-- ⚠️ UNTESTED against real pg_net (or vault.decrypted_secrets) locally,
-- unlike the cron.schedule() call below (verified against a real pg_cron
-- install — see task 41/42's report). pg_net and Vault are Supabase-
-- proprietary infrastructure, not part of a vanilla Postgres install (same
-- category of gap already documented in migrations 0011/0014 for the
-- `storage` schema) — the call shapes below match Supabase's own published
-- patterns exactly, but need a live smoke test once this runs against a
-- real Supabase project (confirm a row appears in `net._http_response`
-- after the first scheduled fire, or call `select net.http_post(...)` by
-- hand once with the real secret in place).
-- =============================================================================

-- Non-relocatable (owns a fixed schema, `cron`) — no `with schema` clause;
-- Supabase's own docs enable it the same plain way.
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
    url := 'https://sbaahapi-production.up.railway.app/v1/internal/cron/daily-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
