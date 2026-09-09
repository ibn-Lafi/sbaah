-- =============================================================================
-- Migration 0016: resolve_public_tenant_chrome function
-- PRODUCT_SPEC.md section 2 — task 36/42.
--
-- HOW TO RUN: paste this file's contents into the Supabase SQL Editor
-- (Dashboard → SQL Editor → New query) and run it, in order, after
-- migration 0015.
-- =============================================================================

-- `anon` has NO select policy on `tenants` at all (migration 0005 —
-- "it must never see billing/CR/tax data"). `GET /v1/public/website`
-- (task 32/42) was querying `tenants` directly with the anon client for
-- display columns (name_ar/name_en/account_type) — against real RLS
-- this returns zero rows, a bug that mock-based testing this session
-- could never catch (mocks don't enforce RLS). Fixed here alongside the
-- actual reason this migration exists: task 36/42 needs to tell "no
-- tenant matches this domain" apart from "a tenant matches but is
-- suspended/cancelled" (PRODUCT_SPEC section 2's "غير متاح حاليًا" page
-- requirement) — `resolve_public_tenant` (migration 0013) filters
-- `status = 'active'` before returning anything, so it structurally
-- cannot distinguish the two. This function does both jobs in one
-- SECURITY DEFINER call, exposing only the same handful of safe display
-- columns `is_tenant_active` already established the pattern for —
-- never subdomain/custom_domain/plan_id/cr_number/tax_number.
--
-- `resolve_public_tenant` itself is left untouched — every other public
-- endpoint (properties, leads validation) that only ever needs "the
-- active tenant's id, or nothing" keeps using it exactly as before.
create function resolve_public_tenant_chrome(p_subdomain text, p_custom_domain text)
returns table(id uuid, status tenant_status, name_ar text, name_en text, account_type account_type)
language sql
stable
security definer
set search_path = public
as $$
  select id, status, name_ar, name_en, account_type from tenants
  where
    (p_subdomain is not null and subdomain = p_subdomain)
    or (p_custom_domain is not null and custom_domain = p_custom_domain and custom_domain_status = 'verified')
  limit 1;
$$;

grant execute on function resolve_public_tenant_chrome(text, text) to anon, authenticated;
