import type { NextRequest } from 'next/server';
import { createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyWebhookSignature } from '@/lib/billing/streampay-client';

interface StreamPayWebhookEvent {
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  status?: string;
}

/**
 * StreamPay → us, on payment events. The source of truth for whether a
 * checkout actually succeeded — registration/billing never trusts the
 * browser simply *returning* from StreamPay's hosted page (a closed tab,
 * a flaky redirect, or a forged success_url hit would all lie).
 *
 * Signature header confirmed as `X-Webhook-Signature` (see
 * streampay-client.ts's file comment) — the previous guesses
 * (stream-signature/x-stream-signature/signature) never matched, so
 * every real webhook delivery was silently rejected regardless of
 * whether the underlying payment actually succeeded. `request.text()`
 * (not `.json()`) so the exact raw bytes are available for HMAC
 * verification before parsing.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get('x-webhook-signature');

  if (!verifyWebhookSignature(rawBody, signatureHeader)) {
    throw new ApiError(401, 'invalid_signature', 'توقيع غير صالح');
  }

  const event = JSON.parse(rawBody) as StreamPayWebhookEvent;
  const providerReference = event.entity_id;
  if (!providerReference) {
    return okResponse({ status: 'ignored' });
  }

  const supabase = createServiceRoleClient();
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, tenant_id, plan_id, status')
    .eq('provider_reference', providerReference)
    .maybeSingle();
  if (paymentError) {
    throw new Error(`Failed to look up payment for webhook: ${paymentError.message}`);
  }
  // Not one of ours (or a payment link created before its provider_reference
  // was recorded) — acknowledge so StreamPay stops retrying, do nothing else.
  if (!payment) {
    return okResponse({ status: 'ignored' });
  }

  const succeeded =
    event.event_type === 'PAYMENT_SUCCEEDED' || event.event_type === 'INVOICE_COMPLETED';
  const failed = event.event_type === 'PAYMENT_FAILED';

  if (succeeded && payment.status !== 'paid') {
    // `plan_id` is written unconditionally here, not just for a plan
    // switch — this is the ONE place a checkout's outcome is trusted
    // (never the browser's redirect back from StreamPay's hosted page),
    // so applying it is what actually makes "غيّر باقتك" or a renewal
    // take effect. A paid plan also ends any free trial: otherwise
    // is_tenant_active() would still lock the account when the old trial
    // date passes. The tenant is updated before the payment row, so if
    // either write fails the payment stays unpaid and StreamPay's retry
    // re-applies both instead of skipping an already-"paid" payment.
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({ payment_status: 'paid', plan_id: payment.plan_id, trial_ends_at: null })
      .eq('id', payment.tenant_id);
    if (tenantUpdateError) {
      throw new Error(`Failed to apply successful payment to tenant: ${tenantUpdateError.message}`);
    }
    const { error: paymentUpdateError } = await supabase.from('payments').update({ status: 'paid' }).eq('id', payment.id);
    if (paymentUpdateError) {
      throw new Error(`Failed to record successful payment: ${paymentUpdateError.message}`);
    }
  } else if (failed && payment.status === 'pending') {
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id)
      .eq('status', 'pending');
    if (paymentUpdateError) {
      throw new Error(`Failed to record failed payment: ${paymentUpdateError.message}`);
    }
    // A failed plan switch or renewal attempt must not flag a tenant whose
    // current subscription is already paid.
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({ payment_status: 'failed' })
      .eq('id', payment.tenant_id)
      .neq('payment_status', 'paid');
    if (tenantUpdateError) {
      throw new Error(`Failed to record failed payment on tenant: ${tenantUpdateError.message}`);
    }
  }

  return okResponse({ status: 'ok' });
});
