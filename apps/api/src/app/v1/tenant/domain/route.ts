import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { customDomainInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { dnsRecordFor } from '@/lib/tenant/dns-record';

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
    .select('custom_domain, custom_domain_status, plans(custom_domain_allowed)')
    .eq('id', caller.tenantId)
    .single();
  if (error) {
    throw new Error(`Failed to load domain status: ${error.message}`);
  }

  return okResponse({
    custom_domain: data.custom_domain,
    custom_domain_status: data.custom_domain_status,
    dns_record: data.custom_domain ? dnsRecordFor(data.custom_domain) : null,
    custom_domain_allowed: (data.plans as unknown as { custom_domain_allowed: boolean } | null)?.custom_domain_allowed ?? false,
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { custom_domain } = customDomainInputSchema.parse(await request.json());

  // PRODUCT_SPEC.md section 2/9 — custom_domain_allowed is a real plan
  // feature-gate (`plans.custom_domain_allowed`, editable by the founder
  // via console), not just informational: the Basic plan explicitly
  // excludes it. Re-checked here, not just hidden in the UI, since this
  // endpoint is the actual enforcement point.
  const allowed = await loadCustomDomainAllowed(supabase, caller.tenantId);
  if (!allowed) {
    throw new ApiError(403, 'plan_does_not_allow_custom_domain', 'باقتك الحالية لا تشمل ربط دومين مخصص — يلزم الترقية لباقة أعلى');
  }

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
    custom_domain_allowed: true,
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
