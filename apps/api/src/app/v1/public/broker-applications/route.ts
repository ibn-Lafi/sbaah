import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicBrokerMarketerApplicationInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { extractClientIp, verifyCaptcha } from '@/lib/captcha/verify-captcha';
import { validatePublicTenantTarget } from '@/lib/tenant/validate-public-target';
import {
  BROKER_MARKETER_RATE_LIMIT_CONFIG,
  hasExceededBrokerMarketerRateLimit,
} from '@/lib/broker-marketer/broker-marketer-rate-limit-policy';

/**
 * Unauthenticated — the "الوسطاء والمسوقين" website section's form
 * (migration 0032). `broker_marketer_applications` intentionally has no
 * anon INSERT policy: the service role is used only after re-validating
 * tenant_id/property_id server-side, never trusting them as sent (same
 * pattern as POST /v1/public/leads).
 *
 * Rate-limited by IP, checked BEFORE the captcha call/target validation
 * — same reasoning as leads: a burst against this endpoint shouldn't also
 * burn Turnstile verify requests or DB reads.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = publicBrokerMarketerApplicationInputSchema.parse(await request.json());
  const ip = extractClientIp(request.headers) ?? 'unknown';

  const serviceRole = createServiceRoleClient();
  const windowStart = new Date(Date.now() - BROKER_MARKETER_RATE_LIMIT_CONFIG.windowMs).toISOString();
  const { count: recentAttempts, error: rateLimitError } = await serviceRole
    .from('broker_marketer_application_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', windowStart);
  if (rateLimitError) {
    throw new Error(`Failed to check broker/marketer application rate limit: ${rateLimitError.message}`);
  }
  if (hasExceededBrokerMarketerRateLimit(recentAttempts ?? 0)) {
    throw new ApiError(429, 'application_rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }

  const { error: attemptInsertError } = await serviceRole.from('broker_marketer_application_attempts').insert({ ip });
  if (attemptInsertError) {
    throw new Error(`Failed to record broker/marketer application attempt: ${attemptInsertError.message}`);
  }

  await verifyCaptcha(input.captcha_token, ip === 'unknown' ? null : ip);

  const anon = createAnonClient();
  await validatePublicTenantTarget(anon, input.tenant_id, input.property_id);

  const { error: insertError } = await serviceRole.from('broker_marketer_applications').insert({
    tenant_id: input.tenant_id,
    property_id: input.property_id ?? null,
    full_name: input.full_name,
    city_id: input.city_id,
    fal_license_number: input.fal_license_number,
    applicant_type: input.applicant_type,
  });
  if (insertError) {
    throw new Error(`Failed to save broker/marketer application: ${insertError.message}`);
  }

  return okResponse({ status: 'received' }, 201);
});
