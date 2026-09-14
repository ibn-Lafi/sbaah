-- =============================================================================
-- Migration 0042: email channel for OTP (login + reset_password)
-- docs/OTP_FLOW.md's phone flow stays entirely unchanged. Run after 0041.
--
-- Unlike phone OTP (Authentica owns verification — see migration 0007's
-- header), there is no email-OTP provider in this stack: the code is
-- generated, stored (as a hash, never plaintext) and verified entirely by
-- `api`. `channel` discriminates the two; `phone` becomes nullable since
-- an email-channel row has none, `email`/`code_hash` are only ever set
-- together with channel='email'.
--
-- Registration stays phone-only by design (PRODUCT_SPEC section 2: phone
-- is the sole account-creating identifier) — channel='email' rows are
-- only ever purpose 'login' or 'reset_password', enforced in `api`, not
-- repeated here as a check constraint since `otp_purpose` already has a
-- third value ('register') that would need excluding conditionally,
-- which a plain check can express but the application-level enforcement
-- in otp/send and otp/verify is the actually load-bearing check (the
-- generated code/email pairing itself only exists in `api`, e.g. no
-- Authentica round-trip to also gate it at that layer).
-- =============================================================================

create type otp_channel as enum ('sms', 'email');

alter table otp_verifications
  add column channel otp_channel not null default 'sms',
  add column email text,
  add column code_hash text;

alter table otp_verifications alter column phone drop not null;

alter table otp_verifications add constraint otp_verifications_channel_fields_check check (
  (channel = 'sms' and phone is not null and email is null and code_hash is null)
  or
  (channel = 'email' and email is not null and code_hash is not null and phone is null)
);

create index otp_verifications_email_purpose_idx
  on otp_verifications (email, purpose, created_at desc)
  where email is not null;
