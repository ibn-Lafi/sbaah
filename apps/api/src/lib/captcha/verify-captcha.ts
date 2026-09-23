import { ApiError } from '@/lib/http';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_TIMEOUT_MS = 10_000;

function requireSecretKey(): string {
  const key = process.env.TURNSTILE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing required environment variable: TURNSTILE_SECRET_KEY');
  }
  return key;
}

/**
 * Cloudflare Turnstile — resolves the captcha provider PRODUCT_SPEC
 * sections 4/10 require without naming one. Chosen over reCAPTCHA/hCaptcha:
 * free with no request cap, no cross-site visitor tracking (a KSA privacy
 * expectation worth defaulting to), and a single secret+token server
 * check — same shape as any provider, so swapping later stays a
 * one-file change if this choice is ever revisited.
 */
export async function verifyCaptcha(token: string, remoteIp: string | null): Promise<void> {
  const body = new URLSearchParams({ secret: requireSecretKey(), response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Turnstile verification request failed with status ${response.status}`);
  }

  const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
  if (!result) {
    throw new Error('Turnstile verification returned a non-JSON response');
  }
  if (!result.success) {
    throw new ApiError(400, 'captcha_failed', 'فشل التحقق الأمني، حاول مرة أخرى');
  }
}
