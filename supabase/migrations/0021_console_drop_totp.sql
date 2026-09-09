-- =============================================================================
-- Migration 0021: drop console TOTP columns
-- PRODUCT_SPEC.md section 7 — reverses migration 0017's mandatory 2FA for
-- `console`. Explicit founder decision (informed of the security tradeoff
-- — console is the highest-value target in the system — and asked to
-- proceed anyway): email + password only, no second factor.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, after
-- migration 0020.
-- =============================================================================

alter table platform_admins drop column totp_secret;
alter table platform_admins drop column totp_enabled;

-- Refreshes migration 0001's bootstrap comment: login is now email +
-- password (no TOTP), so the Supabase Auth user created at bootstrap
-- must have an email + password set (Dashboard -> Authentication ->
-- Add user). `phone` on this table stays as contact metadata only —
-- it is no longer used for authentication.
comment on table platform_admins is
  'Bootstrap: after creating your Supabase Auth user with an email + password '
  '(Dashboard -> Authentication -> Add user), insert your own row here manually. '
  'Example (replace the UUID and details):\n'
  'insert into platform_admins (auth_user_id, phone, full_name) '
  'values (''00000000-0000-0000-0000-000000000000'', ''+966500000000'', ''اسمك'');';
