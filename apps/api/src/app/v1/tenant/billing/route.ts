import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

/**
 * Read-only: plan + current usage. No subscribe/upgrade action here —
 * PRODUCT_SPEC.md's payment section flags StreamPay's Recurring Billing
 * support as technically unconfirmed by the founder, so no programmatic
 * payment linking exists yet (informational display only).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('plans(id, name_ar, name_en, price, max_properties, max_users, custom_domain_allowed)')
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Failed to load plan for billing: ${tenantError?.message}`);
  }

  const [{ count: propertyCount, error: propertyError }, { count: userCount, error: userError }] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).neq('status', 'disabled'),
  ]);
  if (propertyError) {
    throw new Error(`Failed to count properties for billing: ${propertyError.message}`);
  }
  if (userError) {
    throw new Error(`Failed to count team members for billing: ${userError.message}`);
  }

  return okResponse({
    plan: tenant.plans,
    usage: {
      properties: propertyCount ?? 0,
      users: userCount ?? 0,
    },
  });
});
