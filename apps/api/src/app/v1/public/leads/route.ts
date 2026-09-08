import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicLeadInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { extractClientIp, verifyCaptcha } from '@/lib/captcha/verify-captcha';

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

  if (input.property_id) {
    const { data: property, error } = await anon
      .from('properties')
      .select('id')
      .eq('id', input.property_id)
      .eq('tenant_id', input.tenant_id)
      .eq('status', 'published')
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to validate lead property: ${error.message}`);
    }
    if (!property) {
      throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
    }
  } else {
    // General inquiry with no specific property — still must be a real, active tenant.
    const { data: isActive, error } = await anon.rpc('is_tenant_active', {
      check_tenant_id: input.tenant_id,
    });
    if (error) {
      throw new Error(`Failed to validate lead tenant: ${error.message}`);
    }
    if (!isActive) {
      throw new ApiError(404, 'tenant_not_found', 'الحساب غير موجود');
    }
  }

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
