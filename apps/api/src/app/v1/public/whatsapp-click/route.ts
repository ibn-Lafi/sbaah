import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicWhatsappClickInputSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { validatePublicLeadTarget } from '@/lib/lead/validate-public-lead-target';

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

  const anon = createAnonClient();
  await validatePublicLeadTarget(anon, input.tenant_id, input.property_id);

  const serviceRole = createServiceRoleClient();
  const { error } = await serviceRole.from('leads').insert({
    tenant_id: input.tenant_id,
    property_id: input.property_id ?? null,
    full_name: 'زائر عبر واتساب',
    phone: null,
    source: 'whatsapp_click',
  });
  if (error) {
    throw new Error(`Failed to log WhatsApp click: ${error.message}`);
  }

  return okResponse({ status: 'received' }, 201);
});
