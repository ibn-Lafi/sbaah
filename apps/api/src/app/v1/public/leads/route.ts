import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicLeadInputSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { extractClientIp, verifyCaptcha } from '@/lib/captcha/verify-captcha';
import { validatePublicLeadTarget } from '@/lib/lead/validate-public-lead-target';

/**
 * Unauthenticated — public-site's inquiry form. `leads` intentionally has
 * no anon INSERT policy (migration 0005): the service role is the
 * documented, narrow exception for this one public-write path, used only
 * after re-validating tenant_id/property_id server-side, never trusting
 * them as sent (PRODUCT_SPEC section 10).
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = publicLeadInputSchema.parse(await request.json());

  await verifyCaptcha(input.captcha_token, extractClientIp(request.headers));

  const anon = createAnonClient();
  await validatePublicLeadTarget(anon, input.tenant_id, input.property_id);

  const serviceRole = createServiceRoleClient();
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
