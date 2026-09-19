import type { NextRequest } from 'next/server';
import { planInputSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/**
 * console-only write side of plans (PRODUCT_SPEC section 2: price/limits
 * are console-managed data, never hardcoded). A public/authenticated read
 * endpoint exists separately at GET /v1/plans — RLS already makes plans
 * openly readable (plans_public_select), so gating reads here too would
 * fight the table's own security design rather than match it.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }
  const { data: tenants, error: tenantError } = await supabase.from('tenants').select('plan_id,status,trial_ends_at');
  if (tenantError) throw new Error(`Failed to load plan usage: ${tenantError.message}`);

  const usage = Object.fromEntries((data ?? []).map((plan) => {
    const assigned = (tenants ?? []).filter((tenant) => tenant.plan_id === plan.id);
    const active = assigned.filter((tenant) => tenant.status === 'active').length;
    const trials = assigned.filter((tenant) => tenant.trial_ends_at && new Date(tenant.trial_ends_at) > new Date()).length;
    return [plan.id, { accounts: assigned.length, active_accounts: active, active_trials: trials }];
  }));

  return okResponse({ plans: data, usage });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const input = planInputSchema.parse(await request.json());

  const { data, error } = await supabase.from('plans').insert(input).select().single();
  if (error) {
    throw new Error(`Failed to create plan: ${error.message}`);
  }
  return okResponse({ plan: data }, 201);
});
