import type { NextRequest } from 'next/server';
import { businessActivitiesUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';

/**
 * Business activity is product configuration, not staff authorization.
 * Existing tenants with no rows are returned as "unconfigured" so we never
 * guess their activity from account_type or legacy user roles.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data, error } = await supabase
    .from('tenant_business_activities')
    .select('activity')
    .eq('tenant_id', caller.tenantId)
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(`Failed to read business activities: ${error.message}`);
  }

  const activities = (data ?? []).map((row) => row.activity);
  return okResponse({ activities, configured: activities.length > 0 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertPermission(caller.role, 'tenant.settings.manage');

  const { activities } = businessActivitiesUpdateSchema.parse(await request.json());

  // Add before delete so a failed insert never leaves a previously configured
  // tenant with no activities. The composite PK makes repeated requests safe.
  const rows = activities.map((activity) => ({
    tenant_id: caller.tenantId,
    activity,
    created_by: caller.userId,
  }));

  const { error: upsertError } = await supabase
    .from('tenant_business_activities')
    .upsert(rows, { onConflict: 'tenant_id,activity', ignoreDuplicates: true });
  if (upsertError) {
    throw new Error(`Failed to save business activities: ${upsertError.message}`);
  }

  const { error: deleteError } = await supabase
    .from('tenant_business_activities')
    .delete()
    .eq('tenant_id', caller.tenantId)
    .not('activity', 'in', `(${activities.join(',')})`);
  if (deleteError) {
    throw new Error(`Failed to remove disabled business activities: ${deleteError.message}`);
  }

  return okResponse({ activities, configured: true });
});
