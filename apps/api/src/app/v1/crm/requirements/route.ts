import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { leadRequirementSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

const leadReferenceSchema = z.object({ lead_id: z.string().uuid() });
const listQuerySchema = z.object({ lead_id: z.string().uuid().optional() });

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.read');
  const { lead_id: leadId } = listQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  if (isAssignedScope(grant)) {
    if (!leadId) return okResponse({ requirements: [] });
    await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, leadId);
  }

  let query = supabase.from('lead_requirements').select('*').eq('tenant_id', caller.tenantId);
  if (leadId) query = query.eq('lead_id', leadId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list lead requirements: ${error.message}`);
  return okResponse({ requirements: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.create');
  const body = await request.json();
  const { lead_id: leadId } = leadReferenceSchema.parse(body);
  const requirement = leadRequirementSchema.parse(body);

  await assertTenantOwnedRow({ supabase, table: 'leads', id: leadId, tenantId: caller.tenantId, label: 'العميل' });
  if (isAssignedScope(grant)) {
    await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, leadId);
  }

  const { data, error } = await supabase
    .from('lead_requirements')
    .insert({ ...requirement, lead_id: leadId, tenant_id: caller.tenantId })
    .select()
    .single();
  if (error) throw new Error(`Failed to create lead requirement: ${error.message}`);
  return okResponse({ requirement: data }, 201);
});
