-- =============================================================================
-- Real per-domain DNS records for custom domains, returned by Railway's own
-- public API (apps/api/src/lib/tenant/railway-api-client.ts) when a domain is
-- registered against the public-site Railway service. Replaces the previous
-- "one shared PUBLIC_SITE_CNAME_TARGET for every tenant" approach: Railway
-- only terminates TLS (and only requests a Let's Encrypt certificate) for a
-- domain it has been explicitly told about via this API call — a customer's
-- domain simply CNAMEd at a static Railway hostname, with Railway never told
-- about that specific domain, never gets a working certificate.
-- =============================================================================

alter table tenants
  add column custom_domain_dns_records jsonb,
  add column custom_domain_railway_id text;

comment on column tenants.custom_domain_dns_records is
  'Array of {type, name, value} DNS records the owner must add — one CNAME (routing) and one TXT (Railway domain-ownership verification), both returned by Railway''s customDomainCreate mutation when custom_domain is set. Null when no custom domain is set.';

comment on column tenants.custom_domain_railway_id is
  'Railway''s own id for this custom domain resource (customDomainCreate''s returned id) — kept so removing the domain can also call customDomainDelete and avoid leaving orphaned, never-verified domains in the Railway project. Null when no custom domain is set.';
