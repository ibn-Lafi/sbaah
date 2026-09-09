import type { SupabaseClient } from '@supabase/supabase-js';
import type { AccountType, TenantStatus } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

function requireRootDomain(): string {
  const value = process.env.PLATFORM_ROOT_DOMAIN;
  if (!value) {
    throw new Error('Missing required environment variable: PLATFORM_ROOT_DOMAIN');
  }
  return value.toLowerCase();
}

/**
 * A host ending in the platform's own root domain (e.g.
 * `myagency.sbaah.app`) is treated as a subdomain lookup; anything else
 * is treated as an exact custom-domain lookup — deciding this here,
 * rather than doing an OR match in SQL, avoids a real ambiguity: without
 * it, an external domain that happens to share a label with someone
 * else's subdomain slug could wrongly resolve to that unrelated tenant.
 */
function toDomainRpcParams(rawDomain: string): { p_subdomain: string | null; p_custom_domain: string | null } {
  const host = rawDomain.trim().toLowerCase().replace(/:\d+$/, ''); // strip a dev port, e.g. localhost:3000
  const rootDomain = requireRootDomain();

  const isPlatformSubdomain = host === rootDomain || host.endsWith(`.${rootDomain}`);
  return isPlatformSubdomain
    ? { p_subdomain: host.slice(0, host.length - rootDomain.length).replace(/\.$/, ''), p_custom_domain: null }
    : { p_subdomain: null, p_custom_domain: host };
}

/**
 * Resolves the Host header `public-site` forwards into a tenant id, via
 * the `resolve_public_tenant` RPC (migration 0013) — `tenants` has no
 * anon select policy (PRODUCT_SPEC section 10), so this is the only way
 * an unauthenticated request can find "which account owns this domain".
 * Only ever returns an *active* tenant's id — every current caller
 * (properties, leads validation) only ever needs "the active tenant, or
 * 404", so this is left exactly as it was before task 36/42.
 */
export async function resolvePublicTenantId(rawDomain: string, supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.rpc('resolve_public_tenant', toDomainRpcParams(rawDomain));
  if (error) {
    throw new Error(`Failed to resolve tenant for domain: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'site_not_found', 'الموقع غير موجود');
  }
  return data as string;
}

export interface PublicTenantChrome {
  id: string;
  status: TenantStatus;
  name_ar: string;
  name_en: string;
  account_type: AccountType;
}

/**
 * Used only by `GET /v1/public/website` (task 36/42) — the one public
 * endpoint that must tell "no tenant matches this domain" apart from "a
 * tenant matches but is suspended/cancelled" (PRODUCT_SPEC section 2's
 * "غير متاح حاليًا" page), which `resolvePublicTenantId` above
 * structurally cannot do since its RPC filters to active tenants only.
 * Returns `null` only for "no such domain at all" — a non-active tenant
 * is still returned (with its `status`), it's the caller's job to
 * branch on that.
 */
export async function resolvePublicTenantChrome(
  rawDomain: string,
  supabase: SupabaseClient,
): Promise<PublicTenantChrome | null> {
  const { data, error } = await supabase.rpc('resolve_public_tenant_chrome', toDomainRpcParams(rawDomain));
  if (error) {
    throw new Error(`Failed to resolve tenant chrome for domain: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as PublicTenantChrome | undefined) ?? null;
}
