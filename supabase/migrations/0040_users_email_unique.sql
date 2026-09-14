-- =============================================================================
-- Migration 0040: unique index on users.email
-- Run after 0039.
--
-- `users.email` (migration 0001) has always been optional, free-form
-- contact info with no uniqueness constraint. It is now becoming a second
-- identifier a person can authenticate with (email-OTP login, email-OTP
-- password reset) in addition to phone — without uniqueness, an email
-- shared by two different users would make "log in with this email" and
-- "reset the password for this email" ambiguous about which account is
-- meant. A partial index (only rows with a non-null email) keeps the
-- existing rows with no email on file valid, and `lower(email)` makes the
-- constraint case-insensitive to match how it is looked up everywhere
-- else (packages/shared's email schemas lower-case on parse).
-- =============================================================================

create unique index users_email_unique_idx on users (lower(email)) where email is not null;
