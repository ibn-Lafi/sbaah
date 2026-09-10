import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicLeadInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { extractClientIp, verifyCaptcha } from '@/lib/captcha/verify-captcha';
import { validatePublicLeadTarget } from '@/lib/lead/validate-public-lead-target';
import { LEAD_RATE_LIMIT_CONFIG, hasExceededLeadRateLimit } from '@/lib/lead/lead-rate-limit-policy';

/**
 * Unauthenticated — public-site's inquiry form. `leads` intentionally has
 * no anon INSERT policy (migration 0005): the service role is the
 * documented, narrow exception for this one public-write path, used only
 * after re-validating tenant_id/property_id server-side, never trusting
 * them as sent (PRODUCT_SPEC section 10).
 *
 * Rate-limited by IP (migration 0029, security audit finding) as
 * defense-in-depth on top of Turnstile — the attempt is logged and
 * checked BEFORE the captcha call/target validation so a burst against
 * this endpoint doesn't also burn Turnstile verify requests or DB reads.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = publicLeadInputSchema.parse(await request.json());
  const ip = extractClientIp(request.headers) ?? 'unknown';

  const serviceRole = createServiceRoleClient();
  const windowStart = new Date(Date.now() - LEAD_RATE_LIMIT_CONFIG.windowMs).toISOString();
  const { count: recentAttempts, error: rateLimitError } = await serviceRole
    .from('lead_submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart);
  if (rateLimitError) {
    throw new Error(`Failed to check lead rate limit: ${rateLimitError.message}`);
  }
  if (hasExceededLeadRateLimit(recentAttempts ?? 0)) {
    throw new ApiError(429, 'lead_rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }

  const { error: attemptInsertError } = await serviceRole.from('lead_submission_attempts').insert({ ip });
  if (attemptInsertError) {
    throw new Error(`Failed to record lead submission attempt: ${attemptInsertError.message}`);
  }

  await verifyCaptcha(input.captcha_token, ip === 'unknown' ? null : ip);

  const anon = createAnonClient();
  await validatePublicLeadTarget(anon, input.tenant_id, input.property_id);

  const { error: insertError } = await serviceRole.from('leads').insert({
    tenant_id: input.tenant_id,
    property_id: input.property_id ?? null,
    full_name: input.full_name,
    phone: input.phone,
    email: input.email ?? null,
    source: 'website_form',
  });
  if (insertError) {
    throw new Error(`Failed to save lead: ${insertError.message}`);
  }

  return okResponse({ status: 'received' }, 201);
});
