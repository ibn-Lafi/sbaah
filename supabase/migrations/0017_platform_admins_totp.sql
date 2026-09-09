-- =============================================================================
-- Migration 0017: platform_admins TOTP columns (mandatory 2FA for console)
-- PRODUCT_SPEC.md section 7 ("مصادقة ثنائية (2FA) إلزامية") — task 37/42.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, after
-- migration 0016.
-- =============================================================================

-- `totp_secret` is only ever read/written by `api` via the service role
-- (never by the anon/authenticated client directly — see
-- apps/api/src/app/v1/console-auth/*). `totp_enabled` starts false: the
-- first login after bootstrap (migration 0001's manual `platform_admins`
-- insert) walks through one-time TOTP setup before any console session
-- is issued.
alter table platform_admins add column totp_secret text;
alter table platform_admins add column totp_enabled boolean not null default false;
