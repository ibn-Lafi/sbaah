-- =============================================================================
-- Migration 0108: OTP purposes for verified phone/email changes
-- Run after 0107.
--
-- POST /v1/auth/otp/send and POST /v1/auth/profile-change use the purposes
-- 'change_phone' and 'change_email', but `otp_verifications.purpose` is the
-- `otp_purpose` enum from migration 0007, which only has register / login /
-- reset_password. docs/sql/account_profile_otp.sql tried to allow them with
-- a CHECK constraint instead, which cannot work against an enum column (the
-- literals themselves fail to cast), so every change-phone/change-email OTP
-- request failed with a 500 on any database built from this repository.
--
-- ADD VALUE IF NOT EXISTS is a no-op where a value already exists. The guard
-- only skips the change if the column was manually converted away from the
-- enum type in a live database.
-- =============================================================================

do $$
begin
  if exists (select 1 from pg_type where typname = 'otp_purpose' and typnamespace = 'public'::regnamespace) then
    alter type otp_purpose add value if not exists 'change_phone';
    alter type otp_purpose add value if not exists 'change_email';
  end if;
end;
$$;
