import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Thin wrapper over StreamPay's Payment Links API (PRODUCT_SPEC.md
 * section 2 — the founder's chosen gateway; https://streampay.sa/).
 *
 * IMPORTANT — read before touching this file: `docs.streampay.sa` is
 * still blocked by this environment's network egress policy directly,
 * but a second pass (task: "بوابة الدفع لا تعمل نهائيًا") confirmed the
 * shapes below against **multiple independent search-result quotes of
 * StreamPay's own doc pages** (docs.streampay.sa/api/v2-payment-links-create,
 * docs.streampay.sa/webhooks) rather than a single unverified guess —
 * still not a direct fetch, so test a real payment against StreamPay's
 * sandbox before flipping REGISTRATION_OPEN (packages/shared/src/config.ts)
 * back on regardless.
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
 * - POST /payment_links returns a flat object — `{ id, url }` — no
 *   nesting under `data`; `url` is what to redirect the payer to.
 *   Payment links reference a pre-created Product by `product_id` (no
 *   bare "amount" field exists) inside an `items: [{ product_id,
 *   quantity }]` array — so each `plans` row carries its own
 *   `streampay_product_id`, filled in via console once the founder
 *   creates the matching recurring Product in StreamPay's own
 *   dashboard (a one-time manual step, not an API call this codebase
 *   makes).
 * - Redirect fields are `success_redirect_url` / `failure_redirect_url`
 *   — **not** `success_url` / `cancel_url` (the previous, wrong, guess
 *   this file shipped with — StreamPay likely silently ignored the
 *   unrecognized field names, so the payment link probably still got
 *   created but never redirected the payer back to us on success or
 *   failure). Both are optional — omitting them falls back to
 *   StreamPay's own hosted success/failure pages.
 * - `organization_consumer_id` is optional — omitting it makes StreamPay
 *   collect the payer's details on its own hosted checkout page, so this
 *   client never creates/looks up a StreamPay customer itself.
 * - Webhook signature header is confirmed: **`X-Webhook-Signature`**
 *   (previous guesses — `stream-signature`/`x-stream-signature`/
 *   `signature` — never matched, so every real webhook delivery was
 *   silently rejected with 401 regardless of whether the payment link
 *   itself worked). Value carries `t=<timestamp>,v1=<hex hmac>`,
 *   HMAC-SHA256 of `"<timestamp>.<raw body>"` keyed by the webhook
 *   signing secret (Stripe-style) — this part was already correct.
 * - Webhook body shape confirmed: `{ event_type, entity_type, entity_id,
 *   entity_url, status, data, timestamp }` — `event_type` values
 *   `PAYMENT_SUCCEEDED` / `INVOICE_COMPLETED` / `PAYMENT_FAILED` (already
 *   what the webhook route checks) match what search results quote
 *   directly from StreamPay's webhook doc page.
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
  /** StreamPay's real field names are `success_redirect_url`/`failure_redirect_url` — not `success_url`/`cancel_url` as this file previously (wrongly) sent. */
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
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.cancelUrl,
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

/** `signatureHeader` is the raw `X-Webhook-Signature` header value — the route handler reads it and passes it through here. */
/** Reject a webhook whose `t=` timestamp is older/newer than this — closes the replay window (a captured valid request replayed later still has a matching HMAC, since the signature only proves the body+timestamp pair was signed once, not that it's fresh). */
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

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

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > WEBHOOK_TOLERANCE_SECONDS) return false;

  const secret = requireEnv('STREAMPAY_WEBHOOK_SECRET');
  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
