import type { NextRequest } from 'next/server';
import { createAnonClient, createServiceRoleClient, publicLeadInputSchema } from '@sbaah/shared';
import { ApiError, extractClientIp, okResponse, withErrorHandling } from '@/lib/http';
import { verifyCaptcha } from '@/lib/captcha/verify-captcha';
import { validatePublicTenantTarget } from '@/lib/tenant/validate-public-target';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit/enforce-rate-limit';
import { notifyTenant } from '@/lib/notifications/notify';

/**
 * Unauthenticated — public-site's inquiry form. `leads` intentionally has
 * no anon INSERT policy (migration 0005): the service role is the
 * documented, narrow exception for this one public-write path, used only
 * after re-validating tenant_id/property_id server-side, never trusting
 * them as sent (PRODUCT_SPEC section 10).
 *
 * Rate-limited by IP as defense-in-depth on top of Turnstile — the attempt
 * is counted BEFORE the captcha call/target validation so a burst against
 * this endpoint doesn't also burn Turnstile verify requests or DB reads.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = publicLeadInputSchema.parse(await request.json());
  const ip = extractClientIp(request.headers);

  const serviceRole = createServiceRoleClient();
  await enforceRateLimit(serviceRole, RATE_LIMITS.publicLeadPerIp, ip);

  await verifyCaptcha(input.captcha_token, ip);

  const anon = createAnonClient();
  const targetCount = [input.project_id, input.asset_id, input.listing_id].filter(Boolean).length;
  if (targetCount > 1) {
    throw new ApiError(400, 'single_interest_target_required', 'يمكن اختيار مشروع أو عقار واحد فقط');
  }

  if (input.asset_id || input.listing_id) {
    await validatePublicTenantTarget(anon, input.tenant_id, input.listing_id, input.asset_id);
  }

  const interest = input.project_id
    ? { project_id: input.project_id }
    : input.asset_id
      ? { asset_id: input.asset_id }
      : input.listing_id
        ? { listing_id: input.listing_id }
        : null;

  let createdLeadId: string | null = null;
  if (interest) {
    const { data: createdLead, error: insertError } = await serviceRole.rpc('create_public_lead_with_interest', {
      p_tenant_id: input.tenant_id,
      p_lead: { full_name: input.full_name, phone: input.phone, email: input.email ?? null },
      p_interest: interest,
    });
    if (insertError) throw new Error(`Failed to save lead with interest: ${insertError.message}`);
    createdLeadId = Array.isArray(createdLead) ? createdLead[0]?.id ?? null : (createdLead as { id?: string } | null)?.id ?? null;
  } else {
    const { data: createdLead, error: insertError } = await serviceRole.from('leads').insert({
      tenant_id: input.tenant_id,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email ?? null,
      source: 'website_form',
      status: 'new',
    }).select('id').single();
    if (insertError) throw new Error(`Failed to save public lead: ${insertError.message}`);
    createdLeadId = createdLead.id;
  }

  // Some database function versions do not return the created row. Resolve it
  // narrowly so a website inquiry still produces a useful, direct notification.
  if (!createdLeadId) {
    const { data: createdLead } = await serviceRole.from('leads').select('id').eq('tenant_id', input.tenant_id).eq('phone', input.phone).order('created_at', { ascending: false }).limit(1).maybeSingle();
    createdLeadId = createdLead?.id ?? null;
  }
  if (createdLeadId) {
    await notifyTenant({ tenantId: input.tenant_id, category: 'customers', level: 'new', title: 'طلب جديد من الموقع', body: `أرسل ${input.full_name} طلبًا جديدًا من موقعك.`, href: `/leads/${createdLeadId}`, eventKey: `lead:${createdLeadId}:website-created` });
  }

  return okResponse({ status: 'received' }, 201);
});
