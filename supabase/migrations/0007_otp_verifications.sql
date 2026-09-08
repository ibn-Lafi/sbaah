-- =============================================================================
-- Migration 0007: OTP verification tracking
-- docs/OTP_FLOW.md (task 9/35). Run after 0006.
--
-- NOT part of the original 15-table data model in PRODUCT_SPEC.md section 9
-- — discovered while designing the actual Authentica integration (task 9/35).
-- Authentica almost certainly owns the OTP code's lifecycle itself (see
-- docs/OTP_FLOW.md section 2), so this table stores no OTP code at all.
-- Its only job is our OWN abuse/cost control on top of Authentica: how many
-- SMS were requested for a phone number recently, and whether that phone is
-- currently locked out after too many failed verify attempts.
--
-- RLS is enabled with ZERO policies for anon/authenticated — this table is
-- touched exclusively by `api`'s pre-auth endpoints (send-otp/verify-otp),
-- which run before any user JWT exists and therefore use the Supabase
-- service role, the same pattern already used for public lead/view inserts
-- in migration 0005. Postgres service role bypasses RLS entirely, so "zero
-- policies" here means "nobody except that narrow server-side code path can
-- read or write this table" — not an oversight.
-- =============================================================================

create type otp_purpose as enum ('register', 'login', 'reset_password');

create table otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  purpose otp_purpose not null,
  -- Authentica's own verification/session id for this request, if its API
  -- returns one (needed to call their "check/verify" endpoint) — nullable
  -- until task 12/35 confirms the real response shape.
  provider_reference text,
  attempt_count int not null default 0,
  locked_until timestamptz,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index otp_verifications_phone_purpose_idx
  on otp_verifications (phone, purpose, created_at desc);

create index otp_verifications_locked_until_idx
  on otp_verifications (locked_until)
  where locked_until is not null;

alter table otp_verifications enable row level security;

comment on table otp_verifications is
  'No RLS policies by design — accessed only via the service role from api''s pre-auth endpoints (no user JWT exists yet at this point). See docs/OTP_FLOW.md.';
