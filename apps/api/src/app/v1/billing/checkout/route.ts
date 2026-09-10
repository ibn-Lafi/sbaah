import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';
import { createPaymentLink } from '@/lib/billing/streampay-client';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Registration step 6 (اختر باقة وادفع) and any later re-checkout from
 * /billing both land here — creates a `payments` row for the tenant's
 * current plan (its intro price for the first `intro_months`, else its
 * regular price) and a matching StreamPay payment link, and returns the
 * URL to redirect the browser to. `payments` has no authenticated write
 * RLS policy (migration 0027) on purpose — a client could otherwise
 * fabricate a "paid" row — so every write here goes through the service
 * role, gated by the Owner check above it.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase: authClient } = getAuthenticatedClient(request);
  const caller = await getCallerContext(authClient);
  assertOwner(caller.role);

  const supabase = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('plan_id, plans(id, name_ar, price, intro_price, streampay_product_id)')
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Failed to load tenant plan for checkout: ${tenantError?.message}`);
  }

  const plan = tenant.plans as unknown as {
    id: string;
    name_ar: string;
    price: number;
    intro_price: number | null;
    streampay_product_id: string | null;
  } | null;
  if (!plan) {
    throw new Error('Tenant has no plan assigned — cannot start checkout');
  }
  if (!plan.streampay_product_id) {
    throw new ApiError(
      409,
      'plan_not_payable',
      'هذه الباقة غير مهيأة للدفع بعد، تواصل مع فريق سبعة',
    );
  }

  const amount = plan.intro_price ?? plan.price;

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({ tenant_id: caller.tenantId, plan_id: plan.id, amount, status: 'pending' })
    .select()
    .single();
  if (paymentError || !payment) {
    throw new Error(`Failed to create payment record: ${paymentError?.message}`);
  }

  const dashboardUrl = requireEnv('DASHBOARD_APP_URL');

  let paymentLink;
  try {
    paymentLink = await createPaymentLink({
      name: `اشتراك سبعة — ${plan.name_ar}`,
      productId: plan.streampay_product_id,
      successUrl: `${dashboardUrl}/billing?checkout=success`,
      cancelUrl: `${dashboardUrl}/billing?checkout=cancelled`,
    });
  } catch (err) {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    throw err;
  }

  const { error: updateError } = await supabase
    .from('payments')
    .update({ provider_reference: paymentLink.id })
    .eq('id', payment.id);
  if (updateError) {
    throw new Error(`Failed to record StreamPay payment link reference: ${updateError.message}`);
  }

  return okResponse({ checkout_url: paymentLink.url });
});
