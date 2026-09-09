-- =============================================================================
-- Migration 0022: console login lockout table
-- PRODUCT_SPEC.md section 7 — task 42/42 (final security review).
--
-- Removing mandatory TOTP from `console` (migration 0021) left password
-- guessing against `console` — the system's highest-value target — with
-- no application-level brute-force defense at all. Keyed by the raw
-- email string typed at login, not by platform_admins.id — the row must
-- exist and rate-limit BEFORE we know whether the email even belongs to
-- a real admin (otherwise an attacker gets unlimited guesses against any
-- email that isn't a real admin's, and — more importantly — locking only
-- after resolving to a real admin id would mean the lockout check itself
-- happens after a DB lookup keyed by an attacker-controlled string with
-- no rate limit on THAT lookup either).
--
-- Only ever touched by `api` via the service role (see
-- lib/console-auth/login-lockout.ts) — RLS is enabled with zero policies
-- (default-deny), matching every other table in this project rather
-- than leaving it as the one unprotected exception.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, after
-- migration 0021.
-- =============================================================================

create table console_login_attempts (
  email text primary key,
  attempt_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

alter table console_login_attempts enable row level security;
