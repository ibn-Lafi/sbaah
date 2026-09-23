import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

/**
 * Re-applies the suspended/expired-tenant read-only rule
 * (`tenants_tenant_active_update`, migration 0019) for writes that run with
 * the service role and therefore bypass RLS.
 */
export async function assertTenantActive(serviceRole: SupabaseClient, tenantId: string): Promise<void> {
  const { data: isActive, error } = await serviceRole.rpc('is_tenant_active', { check_tenant_id: tenantId });
  if (error) throw new Error(`Failed to check tenant status: ${error.message}`);
  if (!isActive) throw new ApiError(403, 'tenant_not_active', 'الحساب معلَّق حاليًا، لا يمكن تعديل بياناته');
}
