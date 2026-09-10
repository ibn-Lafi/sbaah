-- =============================================================================
-- Migration 0029: rate limiting for POST /v1/public/leads
--
-- Security audit finding: the endpoint is Turnstile-gated but has no rate
-- limit of its own — Turnstile alone doesn't stop a moderately resourced
-- attacker from mass-inserting `leads` rows tied to a real tenant/property
-- (CRM spam, wasted daily-digest emails, DB bloat). This table is pure
-- rate-limit bookkeeping (not a copy of lead content) — every POST attempt
-- (success or failure) is logged by IP so the route can count recent hits
-- before doing any real work.
--
-- Same "zero RLS policies" pattern as otp_verifications (migration 0007):
-- touched exclusively by api's public/leads route via the service role,
-- which bypasses RLS entirely — no anon/authenticated policy is needed or
-- intended.
-- =============================================================================

-- No tenant_id column on purpose: the rate limit is IP-scoped only, logged
-- BEFORE tenant_id is validated against the tenants table (so a bogus
-- tenant_id in the request can't itself throw an FK error on this insert).
create table lead_submission_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index lead_submission_attempts_ip_idx on lead_submission_attempts (ip, created_at desc);

alter table lead_submission_attempts enable row level security;

comment on table lead_submission_attempts is
  'No RLS policies by design — accessed only via the service role from api''s POST /v1/public/leads (rate-limit bookkeeping, not lead content).';
