import type { NextRequest } from 'next/server';
import { customDomainInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { dnsRecordFor } from '@/lib/tenant/dns-record';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase
    .from('tenants')
    .select('custom_domain, custom_domain_status')
    .eq('id', caller.tenantId)
    .single();
  if (error) {
    throw new Error(`Failed to load domain status: ${error.message}`);
  }

  return okResponse({
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status,
    dns_record: data.custom_domain ? dnsRecordFor(data.custom_domain) : null,
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { custom_domain } = customDomainInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('tenants')
    .update({ custom_domain, custom_domain_status: 'pending' })
    .eq('id', caller.tenantId)
    .select('custom_domain, custom_domain_status')
    .single();
  if (error) {
    // tenants.custom_domain is globally unique — a plausible real
    // collision (another tenant already claimed this domain).
    if (error.code === '23505') {
      throw new ApiError(409, 'domain_already_taken', 'هذا الدومين مستخدَم بالفعل من حساب آخر');
    }
    throw new Error(`Failed to set custom domain: ${error.message}`);
  }

  return okResponse({
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status,
    dns_record: dnsRecordFor(data.custom_domain as string),
  });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { error } = await supabase
    .from('tenants')
    .update({ custom_domain: null, custom_domain_status: null })
    .eq('id', caller.tenantId);
  if (error) {
    throw new Error(`Failed to remove custom domain: ${error.message}`);
  }

  return okResponse({ status: 'removed' });
});
