import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Thin wrapper over StreamPay's Payment Links API (PRODUCT_SPEC.md
 * section 2 — the founder's chosen gateway; https://streampay.sa/).
 *
 * IMPORTANT — read before touching this file: `docs.streampay.sa` is
 * blocked by this environment's network egress policy (same gap flagged
 * in PRODUCT_SPEC.md when the gateway was first chosen), so every shape
 * below comes from public search-result summaries of StreamPay's own
 * docs, not a verified fetch of the actual pages. Test a real payment
 * against StreamPay's sandbox before flipping REGISTRATION_OPEN
 * (packages/shared/src/config.ts) back on — if a field name here is
 * wrong, StreamPay's error response (thrown as-is below) will say so.
 *
 * Confirmed by multiple independent search results (higher confidence):
 * - Base URL: https://stream-app-service.streampay.sa/api/v2
 * - Auth: header `x-api-key`, value = `STREAMPAY_API_KEY` sent as-is,
 *   no encoding done by this codebase. Confirmed directly from the
 *   founder's StreamPay dashboard screenshot: the "إنشاء مفتاح API"
 *   screen shows three fields — "مفتاح API" (a UUID), "المفتاح السري"
 *   (a second UUID), and a third "x-api-key" field that is already
 *   base64("<مفتاح API>:<المفتاح السري>") — StreamPay pre-computes the
 *   Basic-Auth-style pairing for you. `STREAMPAY_API_KEY` must be set to
 *   that THIRD field's value verbatim, not the raw first field and not
 *   something this codebase derives itself.
 * - POST /payment_links returns an object with a `url` field to redirect
 *   the payer to; payment links reference a pre-created Product by
 *   `product_id` (no bare "amount" field appears to exist) — so each
 *   `plans` row carries its own `streampay_product_id`, filled in via
 *   console once the founder creates the matching recurring Product in
 *   StreamPay's own dashboard (a one-time manual step, not an API call
 *   this codebase makes).
 * - `organization_consumer_id` is optional — omitting it makes StreamPay
 *   collect the payer's details on its own hosted checkout page, so this
 *   client never creates/looks up a StreamPay customer itself.
 * - Webhook signature: header carries `t=<timestamp>,v1=<hex hmac>`,
 *   HMAC-SHA256 of `"<timestamp>.<raw body>"` keyed by the webhook
 *   signing secret (Stripe-style). The exact header NAME was not
 *   confirmed — `verifyWebhookSignature` below accepts the raw header
 *   value regardless of which header it arrived on; the route handler
 *   passes whichever header StreamPay actually sends.
 */

const STREAMPAY_BASE_URL = 'https://stream-app-service.streampay.sa/api/v2';
const REQUEST_TIMEOUT_MS = 15_000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function authHeaderValue(): string {
  return requireEnv('STREAMPAY_API_KEY');
}

export interface CreatePaymentLinkParams {
  /** Shown to the payer on StreamPay's hosted checkout page. */
  name: string;
  /** `plans.streampay_product_id` — the recurring Product this payment link charges for. */
  productId: string;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StreamPayPaymentLink {
  /** StreamPay's own id for this payment link — stored as `payments.provider_reference` so the webhook can match a later event back to it. */
  id: string;
  url: string;
}

export async function createPaymentLink(
  params: CreatePaymentLinkParams,
  fetchImpl: typeof fetch = fetch,
): Promise<StreamPayPaymentLink> {
  const response = await fetchImpl(`${STREAMPAY_BASE_URL}/payment_links`, {
    method: 'POST',
    headers: {
      'x-api-key': authHeaderValue(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: params.name,
      currency: params.currency ?? 'SAR',
      items: [{ product_id: params.productId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `StreamPay payment link creation failed: HTTP ${response.status} — ${JSON.stringify(json)}`,
    );
  }

  const record = json as { id?: string; url?: string; data?: { id?: string; url?: string } };
  const id = record.id ?? record.data?.id;
  const url = record.url ?? record.data?.url;
  if (!id || !url) {
    throw new Error(`Unexpected StreamPay payment link response shape: ${JSON.stringify(json)}`);
  }

  return { id, url };
}

/**
 * `signatureHeader` is whatever StreamPay's webhook request actually
 * carries — the exact header name isn't confirmed (see file header
 * comment), so the route handler is responsible for locating it.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const secret = requireEnv('STREAMPAY_WEBHOOK_SECRET');
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
