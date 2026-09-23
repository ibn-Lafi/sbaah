import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

const activityInputSchema = z.object({
  lead_id: z.string().uuid(),
  activity_type: z.string().trim().min(1).max(64),
  summary: z.string().trim().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
});
const listQuerySchema = z.object({ lead_id: z.string().uuid().optional() });

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.read');
  const { lead_id: leadId } = listQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  // An agent's activity feed is always per assigned lead, never tenant-wide.
  if (isAssignedScope(grant)) {
    if (!leadId) return okResponse({ activities: [] });
    await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, leadId);
  }

  let query = supabase.from('crm_activities').select('*').eq('tenant_id', caller.tenantId);
  if (leadId) query = query.eq('lead_id', leadId);
  const { data, error } = await query.order('occurred_at', { ascending: false });
  if (error) throw new Error(`Failed to list CRM activities: ${error.message}`);
  return okResponse({ activities: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.create');
  const input = activityInputSchema.parse(await request.json());

  await assertTenantOwnedRow({ supabase, table: 'leads', id: input.lead_id, tenantId: caller.tenantId, label: 'العميل' });
  if (isAssignedScope(grant)) {
    await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, input.lead_id);
  }

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({ ...input, tenant_id: caller.tenantId, user_id: caller.userId })
    .select()
    .single();
  if (error) throw new Error(`Failed to create CRM activity: ${error.message}`);
  return okResponse({ activity: data }, 201);
});
