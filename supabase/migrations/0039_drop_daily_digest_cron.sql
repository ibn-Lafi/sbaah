-- =============================================================================
-- Migration 0039: remove the daily lead-follow-up digest cron job
-- Run after 0038.
--
-- The digest feature (migration 0020, POST /v1/internal/cron/daily-digest)
-- is being replaced by a broader email-notification system (team invites,
-- OTP login/reset by email, new-lead-assigned alerts) — the digest itself
-- is not part of that replacement and is being dropped outright, not
-- ported. This migration only unschedules the pg_cron job; it does not
-- edit or delete migration 0020 itself (already-applied migrations are
-- never rewritten after the fact — see that file's own header for why).
--
-- `pg_cron`/`pg_net` extensions themselves stay enabled — `cron.unschedule`
-- only removes this one named job, not the extensions.
-- =============================================================================

select cron.unschedule(jobid) from cron.job where jobname = 'daily-lead-followup-digest';
