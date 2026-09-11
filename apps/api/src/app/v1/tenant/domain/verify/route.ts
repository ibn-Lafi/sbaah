import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { verifyDomainDns } from '@/lib/tenant/verify-domain-dns';

/**
 * Self-service DNS verification (founder's explicit decision — no
 * manual console review, same "add domain → get DNS records → test
 * connection" flow as any SaaS custom-domain feature). The owner clicks
 * "اختبار الربط" after pointing their domain's DNS at us; this does a
 * real CNAME lookup and flips `custom_domain_status` to 'verified' the
 * moment it resolves correctly — no admin in the loop at all.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { data: tenant, error: loadError } = await supabase
    .from('tenants')
    .select('custom_domain, custom_domain_status')
    .eq('id', caller.tenantId)
    .single();
  if (loadError) {
    throw new Error(`Failed to load tenant for domain verification: ${loadError.message}`);
  }
  if (!tenant.custom_domain) {
    throw new ApiError(400, 'no_custom_domain', 'لا يوجد دومين مخصص مضاف بعد');
  }

  if (tenant.custom_domain_status === 'verified') {
    return okResponse({ custom_domain_status: 'verified' as const, verified: true });
  }

  const verified = await verifyDomainDns(tenant.custom_domain);
  if (!verified) {
    return okResponse({ custom_domain_status: 'pending' as const, verified: false });
  }

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ custom_domain_status: 'verified' })
    .eq('id', caller.tenantId);
  if (updateError) {
    throw new Error(`Failed to mark domain verified: ${updateError.message}`);
  }

  return okResponse({ custom_domain_status: 'verified' as const, verified: true });
});
