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
 * Signature header name isn't confirmed (see streampay-client.ts's file
 * comment) — tries every header StreamPay plausibly uses; if none
 * verify, the request is rejected. `request.text()` (not `.json()`) so
 * the exact raw bytes are available for HMAC verification before
 * parsing.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get('stream-signature') ??
    request.headers.get('x-stream-signature') ??
    request.headers.get('signature');

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
    // take effect. A no-op when the payment was for the tenant's
    // already-current plan.
    const [{ error: paymentUpdateError }, { error: tenantUpdateError }] = await Promise.all([
      supabase.from('payments').update({ status: 'paid' }).eq('id', payment.id),
      supabase.from('tenants').update({ payment_status: 'paid', plan_id: payment.plan_id }).eq('id', payment.tenant_id),
    ]);
    if (paymentUpdateError || tenantUpdateError) {
      throw new Error(
        `Failed to record successful payment: ${paymentUpdateError?.message ?? tenantUpdateError?.message}`,
      );
    }
  } else if (failed) {
    const [{ error: paymentUpdateError }, { error: tenantUpdateError }] = await Promise.all([
      supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id),
      supabase.from('tenants').update({ payment_status: 'failed' }).eq('id', payment.tenant_id),
    ]);
    if (paymentUpdateError || tenantUpdateError) {
      throw new Error(
        `Failed to record failed payment: ${paymentUpdateError?.message ?? tenantUpdateError?.message}`,
      );
    }
  }

  return okResponse({ status: 'ok' });
});
