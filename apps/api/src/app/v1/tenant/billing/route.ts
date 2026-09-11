import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

/** One billing-cycle interval after the tenant's last successful payment — a computed display value, not a real recurring-billing schedule (PRODUCT_SPEC's StreamPay auto-charge behavior is still unconfirmed; renewal today is the owner clicking "جدّد الدفع"). Correct regardless of whether StreamPay ever auto-charges. */
function nextRenewalAt(lastPaidAt: string, billingCycle: 'monthly' | 'annual'): string {
  const date = new Date(lastPaidAt);
  if (billingCycle === 'annual') {
    date.setUTCFullYear(date.getUTCFullYear() + 1);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return date.toISOString();
}

/**
 * Read-only: current plan + payment status + usage + computed next
 * renewal date. Upgrading/renewing happens via POST /v1/billing/checkout
 * (with or without a target plan_id) — this endpoint just gives /billing
 * enough to decide what to show (a "فشل الدفع" banner, which plans can be
 * switched to, …).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select(
      'payment_status, plans(id, name_ar, name_en, billing_cycle, price, description_ar, max_properties, max_users, custom_domain_allowed)',
    )
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Failed to load plan for billing: ${tenantError?.message}`);
  }
  const plan = tenant.plans as unknown as { billing_cycle: 'monthly' | 'annual' } | null;
  if (!plan) {
    throw new Error('Tenant has no plan assigned');
  }

  const [
    { count: propertyCount, error: propertyError },
    { count: userCount, error: userError },
    { data: lastPayment, error: lastPaymentError },
  ] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).neq('status', 'disabled'),
    supabase
      .from('payments')
      .select('created_at')
      .eq('tenant_id', caller.tenantId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (propertyError) {
    throw new Error(`Failed to count properties for billing: ${propertyError.message}`);
  }
  if (userError) {
    throw new Error(`Failed to count team members for billing: ${userError.message}`);
  }
  if (lastPaymentError) {
    throw new Error(`Failed to load last payment for billing: ${lastPaymentError.message}`);
  }

  return okResponse({
    plan: tenant.plans,
    payment_status: tenant.payment_status,
    next_renewal_at: lastPayment ? nextRenewalAt(lastPayment.created_at, plan.billing_cycle) : null,
    usage: {
      properties: propertyCount ?? 0,
      users: userCount ?? 0,
    },
  });
});
