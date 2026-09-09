-- =============================================================================
-- Migration 0015: leads.phone nullable
-- PRODUCT_SPEC.md section 4 — task 34/42.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, after
-- migration 0014.
-- =============================================================================

-- A WhatsApp click-to-chat interaction (source = 'whatsapp_click') has no
-- visitor-submitted contact info at all — a wa.me link opens the
-- *visitor's own* WhatsApp client, the site never learns their phone
-- number. The form-submitted lead (source = 'website_form') and
-- staff-entered lead (source = 'manual') still always carry a real phone
-- (enforced at the Zod schema layer — saudiPhoneSchema — not the DB);
-- this only relaxes the DB-level constraint for the one source that
-- structurally cannot have one.
alter table leads alter column phone drop not null;
