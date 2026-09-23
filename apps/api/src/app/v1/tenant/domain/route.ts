import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceRoleClient, customDomainInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { createCloudflareCustomHostname, deleteCloudflareCustomHostname } from '@/lib/tenant/cloudflare-api-client';
import { dnsRecordsFor, type DnsRecord } from '@/lib/tenant/domain-dns-records';
import { assertTenantActive } from '@/lib/tenant/assert-tenant-active';

/**
 * A custom domain equal to (or a subdomain of) the platform's own root
 * domain would never actually route through the custom-domain path anyway
 * — `resolvePublicTenantChrome`'s `toDomainRpcParams` treats any host
 * ending in `PLATFORM_ROOT_DOMAIN` as a platform-subdomain lookup, not a
 * custom-domain one (see resolve-public-tenant.ts) — but storing one here
 * unchecked would still let an owner get it into a 'verified' state (in
 * principle; Cloudflare itself is very unlikely to let a hostname already
 * inside our own zone be registered as a Custom Hostname) and would then
 * feed [locale]/layout.tsx's subdomain→custom-domain redirect with a
 * target inside our own platform, including possibly another tenant's
 * subdomain. Rejected outright rather than relying only on that being
 * unreachable in practice.
 */
function assertNotPlatformDomain(customDomain: string): void {
  const rootDomain = process.env.PLATFORM_ROOT_DOMAIN?.toLowerCase();
  if (!rootDomain) {
    throw new Error('Missing required environment variable: PLATFORM_ROOT_DOMAIN');
  }
  const host = customDomain.toLowerCase();
  if (host === rootDomain || host.endsWith(`.${rootDomain}`)) {
    throw new ApiError(400, 'invalid_custom_domain', 'لا يمكن استخدام دومين المنصة نفسه كدومين مخصص');
  }
}

async function loadCustomDomainAllowed(supabase: SupabaseClient, tenantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tenants')
    .select('plans(custom_domain_allowed)')
    .eq('id', tenantId)
    .single();
  if (error || !data) {
    throw new Error(`Failed to load plan for domain check: ${error?.message}`);
  }
  return (data.plans as unknown as { custom_domain_allowed: boolean } | null)?.custom_domain_allowed ?? false;
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase
    .from('tenants')
    .select('custom_domain, custom_domain_status, custom_domain_dns_records, plans(custom_domain_allowed)')
    .eq('id', caller.tenantId)
    .single();
  if (error) {
    throw new Error(`Failed to load domain status: ${error.message}`);
  }

  return okResponse({
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status,
    dns_records: (data.custom_domain_dns_records as DnsRecord[] | null) ?? [],
    custom_domain_allowed: (data.plans as unknown as { custom_domain_allowed: boolean } | null)?.custom_domain_allowed ?? false,
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { custom_domain } = customDomainInputSchema.parse(await request.json());
  assertNotPlatformDomain(custom_domain);

  // PRODUCT_SPEC.md section 2/9 — custom_domain_allowed is a real plan
  // feature-gate (`plans.custom_domain_allowed`, editable by the founder
  // via console), not just informational: the Basic plan explicitly
  // excludes it. Re-checked here, not just hidden in the UI, since this
  // endpoint is the actual enforcement point.
  const allowed = await loadCustomDomainAllowed(supabase, caller.tenantId);
  if (!allowed) {
    throw new ApiError(403, 'plan_does_not_allow_custom_domain', 'باقتك الحالية لا تشمل ربط دومين مخصص — يلزم الترقية لباقة أعلى');
  }

  // The domain columns are writable only by the service role (migration
  // 0113), so the checks above are what authorizes this write.
  const serviceRole = createServiceRoleClient();
  await assertTenantActive(serviceRole, caller.tenantId);

  // Registers the domain with Cloudflare itself first — this is what makes
  // Cloudflare start issuing it a real certificate once DNS is pointed
  // correctly (see cloudflare-api-client.ts's doc comment). Done before the
  // database write so a Cloudflare-side failure (e.g. misconfigured API
  // token) never leaves a tenant with a "pending" domain that can never
  // actually verify.
  const cloudflareHostname = await createCloudflareCustomHostname(custom_domain);
  const dnsRecords = dnsRecordsFor(custom_domain, cloudflareHostname);

  const { data, error } = await serviceRole
    .from('tenants')
    .update({
      custom_domain,
      custom_domain_status: 'pending',
      custom_domain_dns_records: dnsRecords,
      custom_domain_cloudflare_id: cloudflareHostname.cloudflareHostnameId,
    })
    .eq('id', caller.tenantId)
    .select('custom_domain, custom_domain_status')
    .single();
  if (error) {
    // tenants.custom_domain is globally unique — a plausible real
    // collision (another tenant already claimed this domain). Best-effort
    // cleanup on Cloudflare's side too, so a rejected domain doesn't linger
    // there under an account that never actually got it.
    await deleteCloudflareCustomHostname(cloudflareHostname.cloudflareHostnameId);
    if (error.code === '23505') {
      throw new ApiError(409, 'domain_already_taken', 'هذا الدومين مستخدَم بالفعل من حساب آخر');
    }
    throw new Error(`Failed to set custom domain: ${error.message}`);
  }

  return okResponse({
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status,
    dns_records: dnsRecords,
    custom_domain_allowed: true,
  });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);
  const serviceRole = createServiceRoleClient();
  await assertTenantActive(serviceRole, caller.tenantId);

  const { data: tenant, error: loadError } = await supabase
    .from('tenants')
    .select('custom_domain_cloudflare_id')
    .eq('id', caller.tenantId)
    .single();
  if (loadError) {
    throw new Error(`Failed to load tenant before removing domain: ${loadError.message}`);
  }
  if (tenant.custom_domain_cloudflare_id) {
    await deleteCloudflareCustomHostname(tenant.custom_domain_cloudflare_id);
  }

  const { error } = await serviceRole
    .from('tenants')
    .update({
      custom_domain: null,
      custom_domain_status: null,
      custom_domain_dns_records: null,
      custom_domain_cloudflare_id: null,
    })
    .eq('id', caller.tenantId);
  if (error) {
    throw new Error(`Failed to remove custom domain: ${error.message}`);
  }

  return okResponse({ status: 'removed' });
});
