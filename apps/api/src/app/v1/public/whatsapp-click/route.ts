import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicWhatsappClickInputSchema } from '@sbaah/shared';
import { ApiError, extractClientIp, okResponse, withErrorHandling } from '@/lib/http';
import { validatePublicTenantTarget } from '@/lib/tenant/validate-public-target';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit/enforce-rate-limit';

/**
 * Unauthenticated — public-site's WhatsApp click-to-chat button fires
 * this (fire-and-forget, before/alongside opening wa.me) so the
 * interaction still becomes a Lead per PRODUCT_SPEC section 4, even
 * though a wa.me click gives the site zero visitor-supplied contact
 * info (migration 0015 made `leads.phone` nullable for exactly this).
 *
 * No captcha here, unlike the inquiry form: this is a low-friction,
 * low-value-target action (worst case is noisy placeholder rows, not a
 * paid SMS send or a real contact-info leak), and the whole point of a
 * "click-to-chat" button is that it's instant — gating it behind a
 * challenge would defeat that.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = publicWhatsappClickInputSchema.parse(await request.json());
  // No captcha by design (see above), so an IP budget is the only thing
  // standing between this endpoint and unlimited placeholder leads.
  await enforceRateLimit(createServiceRoleClient(), RATE_LIMITS.whatsappClickPerIp, extractClientIp(request.headers));

  const anon = createAnonClient();
  await validatePublicTenantTarget(anon, input.tenant_id, input.listing_id, input.asset_id);

  if (input.asset_id && input.listing_id) {
    throw new ApiError(400, 'single_interest_target_required', 'يجب أن يرتبط التفاعل بهدف عقاري واحد فقط');
  }
  const interest = input.asset_id
    ? { asset_id: input.asset_id }
    : input.listing_id
      ? { listing_id: input.listing_id }
      : null;
  if (!interest) throw new ApiError(400, 'interest_target_required', 'الهدف العقاري مطلوب');

  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole.rpc('create_public_lead_with_interest', {
    p_tenant_id: input.tenant_id,
    p_lead: { full_name: 'زائر عبر واتساب', phone: null, source: 'whatsapp_click' },
    p_interest: interest,
  });
  if (error) throw new Error(`Failed to log WhatsApp interest: ${error.message}`);

  return okResponse({ status: 'received' }, 201);
});
