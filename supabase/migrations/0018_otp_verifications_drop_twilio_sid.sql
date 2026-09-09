-- =============================================================================
-- Migration 0018: swap OTP provider from Twilio Verify to Authentica
-- Run after 0017.
--
-- Authentica's /verify-otp checks phone+otp against what we ourselves sent
-- via /send-otp — there is no provider-side verification SID to store or
-- reference, unlike Twilio Verify's Verification SID. This column is dead
-- with the swap; everything else about `otp_verifications` (rate limiting,
-- attempt/lockout tracking, our own 90s expiry) is unchanged — see
-- docs/OTP_FLOW.md.
-- =============================================================================

alter table otp_verifications drop column twilio_verification_sid;

comment on table otp_verifications is
  'No RLS policies by design — accessed only via the service role from api''s pre-auth endpoints (no user JWT exists yet at this point). See docs/OTP_FLOW.md. OTP delivery/verification provider: Authentica (api.authentica.sa).';
