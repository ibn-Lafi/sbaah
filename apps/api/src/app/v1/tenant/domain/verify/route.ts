import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { getCloudflareCustomHostnameDetails } from '@/lib/tenant/cloudflare-api-client';
import { withSslValidationRecords, type DnsRecord } from '@/lib/tenant/domain-dns-records';

/**
 * Self-service verification (founder's explicit decision — no manual
 * console review, same "add domain → get DNS records → test connection"
 * flow as any SaaS custom-domain feature). The owner clicks "اختبار
 * الربط" after pointing their domain's DNS at us; this asks Cloudflare
 * itself whether it now considers the hostname fully connected (routing +
 * certificate issued — see cloudflare-api-client.ts's doc comment on why
 * that's the ground truth, not a DNS lookup we run ourselves) and flips
 * `custom_domain_status` to 'verified' the moment it does — no admin in
 * the loop at all.
 *
 * Also refreshes `custom_domain_dns_records` with Cloudflare's own
 * certificate-validation TXT records (`_acme-challenge.<domain>`) on every
 * check, even when still pending — these aren't necessarily known yet right
 * when the domain is first added (Cloudflare fills them in shortly after),
 * so the owner needs to see them appear here once Cloudflare has them, not
 * just the one ownership-verification TXT captured at creation time. A real
 * gap found in production: without this, a domain can sit "pending"
 * forever because the owner was never shown the second set of DNS records
 * Cloudflare actually needs before it will issue a certificate.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { data: tenant, error: loadError } = await supabase
    .from('tenants')
    .select('custom_domain, custom_domain_status, custom_domain_cloudflare_id, custom_domain_dns_records')
    .eq('id', caller.tenantId)
    .single();
  if (loadError) {
    throw new Error(`Failed to load tenant for domain verification: ${loadError.message}`);
  }
  if (!tenant.custom_domain || !tenant.custom_domain_cloudflare_id) {
    throw new ApiError(400, 'no_custom_domain', 'لا يوجد دومين مخصص مضاف بعد');
  }

  if (tenant.custom_domain_status === 'verified') {
    return okResponse({ custom_domain_status: 'verified' as const, verified: true });
  }

  const { active, sslValidationRecords } = await getCloudflareCustomHostnameDetails(tenant.custom_domain_cloudflare_id);
  const currentRecords = (tenant.custom_domain_dns_records as DnsRecord[] | null) ?? [];
  const refreshedRecords = withSslValidationRecords(currentRecords, sslValidationRecords);

  if (!active) {
    const { error: refreshError } = await supabase
      .from('tenants')
      .update({ custom_domain_dns_records: refreshedRecords })
      .eq('id', caller.tenantId);
    if (refreshError) {
      throw new Error(`Failed to refresh domain DNS records: ${refreshError.message}`);
    }
    return okResponse({ custom_domain_status: 'pending' as const, verified: false });
  }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ custom_domain_status: 'verified', custom_domain_dns_records: refreshedRecords })
    .eq('id', caller.tenantId);
  if (updateError) {
    throw new Error(`Failed to mark domain verified: ${updateError.message}`);
  }

  return okResponse({ custom_domain_status: 'verified' as const, verified: true });
});
