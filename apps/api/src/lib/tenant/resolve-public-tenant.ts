import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

function requireRootDomain(): string {
  const value = process.env.PLATFORM_ROOT_DOMAIN;
  if (!value) {
    throw new Error('Missing required environment variable: PLATFORM_ROOT_DOMAIN');
  }
  return value.toLowerCase();
}

/**
 * Resolves the Host header `public-site` forwards into a tenant id, via
 * the `resolve_public_tenant` RPC (migration 0013) — `tenants` has no
 * anon select policy (PRODUCT_SPEC section 10), so this is the only way
 * an unauthenticated request can find "which account owns this domain".
 *
 * A host ending in the platform's own root domain (e.g.
 * `myagency.sbaah.app`) is treated as a subdomain lookup; anything else
 * is treated as an exact custom-domain lookup — deciding this here,
 * rather than doing an OR match in SQL, avoids a real ambiguity: without
 * it, an external domain that happens to share a label with someone
 * else's subdomain slug could wrongly resolve to that unrelated tenant.
 */
export async function resolvePublicTenantId(rawDomain: string, supabase: SupabaseClient): Promise<string> {
  const host = rawDomain.trim().toLowerCase().replace(/:\d+$/, ''); // strip a dev port, e.g. localhost:3000
  const rootDomain = requireRootDomain();

  const isPlatformSubdomain = host === rootDomain || host.endsWith(`.${rootDomain}`);
  const params = isPlatformSubdomain
    ? { p_subdomain: host.slice(0, host.length - rootDomain.length).replace(/\.$/, ''), p_custom_domain: null }
    : { p_subdomain: null, p_custom_domain: host };

  const { data, error } = await supabase.rpc('resolve_public_tenant', params);
  if (error) {
    throw new Error(`Failed to resolve tenant for domain: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'site_not_found', 'الموقع غير موجود');
  }
  return data as string;
}
