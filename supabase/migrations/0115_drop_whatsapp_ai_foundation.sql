-- 0115: remove the WhatsApp AI/conversation feature — product decision to
-- drop it, not ship it. Nothing in the API or either frontend ever read
-- `whatsapp_conversations`/`whatsapp_messages` (the inbound webhook only
-- wrote to them; migration 0060's AI bot code that would have read them was
-- never wired to a route). POST /v1/public/whatsapp-click (logging a lead
-- from a visitor's wa.me click) is removed the same way, for the same
-- reason: built, never called by the public site.
--
-- The working WhatsApp feature — a tenant's contact number in Settings,
-- shown on the public site and used for the per-lead "واتساب" button in
-- the dashboard — reads `tenants.social_whatsapp` and `leads.phone`
-- directly; neither table dropped here holds any of that, so it is
-- unaffected.
--
-- ⚠️ Destructive: if the webhook was ever actually called in production,
-- this permanently deletes every row in both tables. Before running, check
-- whether there is anything to lose:
--   select count(*) from whatsapp_conversations;
--   select count(*) from whatsapp_messages;
-- A non-zero count does not need to block this — the feature was never
-- surfaced anywhere a founder or tenant could read it — but you may want a
-- pg_dump of both tables first if you want the option of restoring later.

drop table if exists whatsapp_messages;
drop table if exists whatsapp_conversations;
drop type if exists conversation_status;
