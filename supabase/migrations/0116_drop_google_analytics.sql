-- 0116: remove the Google Analytics feature entirely — product decision
-- that neither piece was ever actually adopted (the tenant "app" was never
-- installed by any tenant; the console/platform connection was never
-- completed by the founder either).
--
-- Two independent features, both dropped:
--   * The tenant-facing "app" (apps marketplace, migrations 0065/0066):
--     tenant_integrations (provider column only ever allowed
--     'google_analytics', so the whole table existed for this feature
--     alone) and google_analytics_oauth_states.
--   * The console/platform connection (migration 0054), for the founder's
--     own landing-page traffic: platform_google_analytics and
--     platform_google_analytics_oauth_states.
--
-- Sbaah's own marketing-site GA tag (NEXT_PUBLIC_MARKETING_GA_MEASUREMENT_ID,
-- a plain gtag.js snippet in public-site's layout) is a third, unrelated
-- thing and is not touched by this migration.
--
-- ⚠️ Destructive: if the platform connection was ever actually completed,
-- this deletes its stored (encrypted) refresh token — check first:
--   select measurement_id, connected_at from platform_google_analytics;
-- A non-null connected_at just means Google needs reconnecting if this
-- feature is ever rebuilt; nothing reads these tables today either way.

drop table if exists google_analytics_oauth_states;
drop table if exists tenant_integrations;
drop table if exists platform_google_analytics_oauth_states;
drop table if exists platform_google_analytics;
