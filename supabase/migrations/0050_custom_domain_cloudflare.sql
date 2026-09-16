-- =============================================================================
-- Migration 0050: custom domains move from direct-Railway-registration to
-- Cloudflare for SaaS (Custom Hostnames).
--
-- Why: Railway's own "custom domains per service" plan limit (Hobby: 2,
-- Pro: 20) is incompatible with every tenant wanting their own domain on the
-- SAME public-site Railway service — Railway's own support has confirmed
-- they do not raise this further for multi-tenant use cases at that scale.
-- Cloudflare for SaaS instead terminates TLS/routing at Cloudflare's edge
-- for an effectively unlimited number of tenant hostnames, all forwarded to
-- one shared Fallback Origin configured once in the Cloudflare dashboard
-- (not per-tenant, not managed by this codebase) — see
-- apps/api/src/lib/tenant/cloudflare-api-client.ts's file comment.
--
-- `custom_domain_railway_id` is left in place, unused going forward, rather
-- than dropped — no live tenant had gotten far enough with the old,
-- limit-blocked flow to have a non-null value there, but dropping a column
-- outright is never worth the risk for a column this cheap to just stop
-- writing to.
-- =============================================================================

alter table tenants add column custom_domain_cloudflare_id text;

comment on column tenants.custom_domain_cloudflare_id is
  'Cloudflare''s own id for this Custom Hostname resource (POST .../custom_hostnames'' returned id) — kept so removing the domain can also call the delete endpoint and avoid leaving orphaned, never-verified hostnames on the zone. Null when no custom domain is set.';

comment on column tenants.custom_domain_railway_id is
  'Unused as of migration 0050 (custom domains moved to Cloudflare for SaaS — see custom_domain_cloudflare_id) — kept only so any historical non-null value is not silently discarded.';
