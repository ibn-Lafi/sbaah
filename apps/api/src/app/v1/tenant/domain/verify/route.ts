import { resolve4, resolve6, resolveCname } from 'node:dns/promises';
import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { refreshCloudflareCustomHostnameDetails } from '@/lib/tenant/cloudflare-api-client';
import { dnsRecordsFor } from '@/lib/tenant/domain-dns-records';
import { assertTenantActive } from '@/lib/tenant/assert-tenant-active';

async function resolveAddresses(hostname: string): Promise<string[]> {
  const [ipv4, ipv6] = await Promise.all([
    resolve4(hostname).catch(() => []),
    resolve6(hostname).catch(() => []),
  ]);
  return [...ipv4, ...ipv6];
}

/**
 * Cloudflare keeps a previously activated custom hostname active after its
 * customer-facing DNS record is removed. Verify the live DNS route as well,
 * accepting either a regular CNAME or an apex ALIAS/flattened CNAME whose
 * addresses currently match the SaaS target.
 */
async function isDomainRoutedToTarget(domain: string, target: string): Promise<boolean> {
  const normalizedTarget = target.toLowerCase().replace(/\.$/, '');
  const aliases = await resolveCname(domain).catch(() => []);
  if (aliases.some((alias) => alias.toLowerCase().replace(/\.$/, '') === normalizedTarget)) {
    return true;
  }

  const [domainAddresses, targetAddresses] = await Promise.all([
    resolveAddresses(domain),
    resolveAddresses(target),
  ]);
  const targetSet = new Set(targetAddresses);
  return domainAddresses.length > 0 && domainAddresses.some((address) => targetSet.has(address));
}

/**
 * Self-service verification requires both Cloudflare hostname/certificate
 * activation and a live DNS route to the SaaS target. Re-checking DNS even
 * after a previous success prevents the dashboard from showing "connected"
 * after the owner removes or breaks the record at their DNS provider.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { data: tenant, error: loadError } = await supabase
    .from('tenants')
    .select('custom_domain, custom_domain_cloudflare_id')
    .eq('id', caller.tenantId)
    .single();
  if (loadError) {
    throw new Error(`Failed to load tenant for domain verification: ${loadError.message}`);
  }
  if (!tenant.custom_domain || !tenant.custom_domain_cloudflare_id) {
    throw new ApiError(400, 'no_custom_domain', 'لا يوجد دومين مخصص مضاف بعد');
  }

  const refreshedRecords = dnsRecordsFor(tenant.custom_domain);
  const routingTarget = refreshedRecords[0]?.value;
  if (!routingTarget) {
    throw new Error('Missing custom-domain routing target');
  }

  const [{ active: cloudflareActive, hostnameStatus, sslStatus, sslValidationErrors }, dnsActive] =
    await Promise.all([
      refreshCloudflareCustomHostnameDetails(tenant.custom_domain_cloudflare_id),
      isDomainRoutedToTarget(tenant.custom_domain, routingTarget),
    ]);
  const active = cloudflareActive && dnsActive;

  const serviceRole = createServiceRoleClient();
  await assertTenantActive(serviceRole, caller.tenantId);

  const customDomainStatus = active ? 'verified' : 'pending';
  const { error: updateError } = await serviceRole
    .from('tenants')
    .update({
      custom_domain_status: customDomainStatus,
      custom_domain_dns_records: refreshedRecords,
    })
    .eq('id', caller.tenantId);
  if (updateError) {
    throw new Error(`Failed to update domain verification: ${updateError.message}`);
  }

  return okResponse({
    custom_domain_status: customDomainStatus,
    verified: active,
    cloudflare: {
      hostname_status: hostnameStatus,
      ssl_status: sslStatus,
      ssl_validation_errors: sslValidationErrors,
    },
    dns: { routed: dnsActive },
    dns_records: refreshedRecords,
  });
});

