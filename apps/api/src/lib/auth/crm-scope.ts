import type { SupabaseClient } from '@supabase/supabase-js';
import type { PermissionGrant } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

export function isAssignedScope(grant: PermissionGrant): boolean {
  return grant.scope === 'assigned' || grant.scope === 'own';
}

export async function assertAssignedLeadAccess(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  leadId: string | null | undefined,
): Promise<void> {
  if (!leadId) {
    throw new ApiError(403, 'assigned_lead_required', 'يجب ربط العملية بعميل محتمل مسند إليك');
  }

  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('id', leadId)
    .eq('tenant_id', tenantId)
    .eq('assigned_agent_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to validate CRM assignment: ${error.message}`);
  if (!data) throw new ApiError(403, 'forbidden_scope', 'هذا العميل المحتمل غير مسند إليك');
}
