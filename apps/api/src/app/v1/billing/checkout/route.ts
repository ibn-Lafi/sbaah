import type { NextRequest } from 'next/server';
import { checkoutInputSchema, createServiceRoleClient } from '@sbaah/shared';
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
 * Registration step 6 (اختر باقة وادفع), a renewal re-checkout after a
 * failed payment, and switching plans from /billing all land here —
 * creates a `payments` row for the target plan (its intro price for the
 * first `intro_months` OF THE ACCOUNT's LIFETIME, else its regular price)
 * and a matching StreamPay payment link, and returns the URL to redirect
 * the browser to. Omitting `plan_id` re-checks-out the tenant's current
 * plan (renewal); passing a different active plan's id switches to it —
 * the webhook applies `tenants.plan_id = payments.plan_id` once that
 * specific payment is confirmed (see billing/webhook/streampay/route.ts),
 * so nothing here writes `plan_id` directly — a browser redirect back
 * from StreamPay is never trusted on its own.
 *
 * Intro pricing is scoped to the account's age (`tenants.created_at`),
 * never to "is this the first payment for this plan" — otherwise a
 * long-lived tenant could keep re-triggering the intro price by
 * switching plans back and forth.
 *
 * `payments` has no authenticated write RLS policy (migration 0027) on
 * purpose — a client could otherwise fabricate a "paid" row — so every
 * write here goes through the service role, gated by the Owner check
 * above it.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase: authClient } = getAuthenticatedClient(request);
  const caller = await getCallerContext(authClient);
  assertOwner(caller.role);

  const { plan_id } = checkoutInputSchema.parse(await request.json());

  const supabase = createServiceRoleClient();

  const { data: tenantRow, error: tenantError } = await supabase
    .from('tenants')
    .select('created_at, plans(id, name_ar, price, intro_price, intro_months, streampay_product_id)')
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenantRow) {
    throw new Error(`Failed to load tenant for checkout: ${tenantError?.message}`);
  }

  let plan: {
    id: string;
    name_ar: string;
    price: number;
    intro_price: number | null;
    intro_months: number | null;
    streampay_product_id: string | null;
  } | null;

  if (plan_id) {
    // Switching plans — must be a real, currently-offered plan, not
    // whatever the tenant happens to be on already.
    const { data, error } = await supabase
      .from('plans')
      .select('id, name_ar, price, intro_price, intro_months, streampay_product_id')
      .eq('id', plan_id)
      .eq('is_active', true)
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to load target plan for checkout: ${error.message}`);
    }
    if (!data) {
      throw new ApiError(404, 'plan_not_found', 'الباقة المطلوبة غير موجودة أو لم تعد متاحة');
    }
    plan = data;
  } else {
    plan = tenantRow.plans as unknown as typeof plan;
  }

  if (!plan) {
    throw new Error('No plan resolved for checkout');
  }
  if (!plan.streampay_product_id) {
    throw new ApiError(
      409,
      'plan_not_payable',
      'هذه الباقة غير مهيأة للدفع بعد، تواصل مع فريق سبعة',
    );
  }

  const accountAgeMonths =
    (Date.now() - new Date(tenantRow.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const introEligible =
    plan.intro_price !== null && plan.intro_months !== null && accountAgeMonths < plan.intro_months;
  const amount = introEligible ? plan.intro_price! : plan.price;

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
