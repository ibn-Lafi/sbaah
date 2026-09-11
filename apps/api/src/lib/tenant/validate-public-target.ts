import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

/**
 * Shared by every public write that references a tenant/property without
 * a JWT to trust (inquiry form, WhatsApp click, broker/marketer
 * application) — re-validates the client-supplied `tenant_id`/`property_id`
 * server-side before any insert, never trusting them as sent (PRODUCT_SPEC
 * section 10). Was lib/lead/validate-public-lead-target.ts — moved here
 * once a second domain (broker/marketer applications) started using it,
 * since its logic was never actually lead-specific.
 */
export async function validatePublicTenantTarget(
  anon: SupabaseClient,
  tenantId: string,
  propertyId: string | null | undefined,
): Promise<void> {
  if (propertyId) {
    const { data: property, error } = await anon
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .maybeSingle();
    if (error) {
      throw new Error(`Failed to validate property target: ${error.message}`);
    }
    if (!property) {
      throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
    }
    return;
  }

  // No specific property — still must be a real, active tenant.
  const { data: isActive, error } = await anon.rpc('is_tenant_active', { check_tenant_id: tenantId });
  if (error) {
    throw new Error(`Failed to validate tenant target: ${error.message}`);
  }
  if (!isActive) {
    throw new ApiError(404, 'tenant_not_found', 'الحساب غير موجود');
  }
}
