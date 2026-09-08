-- =============================================================================
-- Migration 0013: public tenant resolution for /v1/public/* endpoints
-- PRODUCT_SPEC.md section 10 — public-site has no JWT, so `api` resolves the
-- tenant from the incoming Host header before running any tenant-scoped
-- query. Run after 0012.
--
-- `tenants` intentionally has NO anon select policy (it holds billing/CR/tax
-- data) — see 0005. This function reads it via `security definer` and
-- returns only the single id needed, never the row itself, exactly like the
-- existing `is_tenant_active()` helper narrows exposure the same way.
--
-- Exactly one of p_subdomain / p_custom_domain should be passed (the caller
-- — apps/api/src/app/v1/public/lib/resolve-tenant.ts — decides which,
-- based on whether the incoming host ends with the platform's own root
-- domain). Passing both or neither still behaves safely (both conditions
-- are just OR'd), but is not the intended call shape.
-- =============================================================================

create function resolve_public_tenant(p_subdomain text, p_custom_domain text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from tenants
  where status = 'active'
    and (
      (p_subdomain is not null and subdomain = p_subdomain)
      or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
    )
  limit 1;
$$;

-- Meant to be called directly by anon (and authenticated, for preview use
-- later) via `.rpc(...)` — unlike the privileged service-role-only
-- functions elsewhere (e.g. create_tenant_with_owner), this one is
-- intentionally public. Explicit grant for clarity, even though it would
-- default to PUBLIC execute anyway.
grant execute on function resolve_public_tenant(text, text) to anon, authenticated;
