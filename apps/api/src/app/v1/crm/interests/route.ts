import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';
import { assertOptionalTenantOwnedRow, assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

const schema = z.object({
  lead_id: z.string().uuid(),
  project_id: z.string().uuid().optional().nullable(),
  unit_type_id: z.string().uuid().optional().nullable(),
  asset_id: z.string().uuid().optional().nullable(),
  listing_id: z.string().uuid().optional().nullable(),
  priority: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (value) =>
    Number(!!value.project_id) +
      Number(!!value.unit_type_id) +
      Number(!!value.asset_id) +
      Number(!!value.listing_id) ===
    1,
  { message: 'يجب تحديد هدف اهتمام واحد فقط' },
);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.read');
  const leadId = request.nextUrl.searchParams.get('lead_id');

  if (isAssignedScope(grant) && !leadId) {
    return okResponse({ interests: [] });
  }
  if (leadId) {
    await assertTenantOwnedRow({ supabase, table: 'leads', id: leadId, tenantId: caller.tenantId, label: 'العميل' });
    if (isAssignedScope(grant)) {
      await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, leadId);
    }
  }

  let query = supabase.from('lead_interests').select('*').eq('tenant_id', caller.tenantId);
  if (leadId) query = query.eq('lead_id', leadId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return okResponse({ interests: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.create');
  const input = schema.parse(await request.json());

  await assertTenantOwnedRow({ supabase, table: 'leads', id: input.lead_id, tenantId: caller.tenantId, label: 'العميل' });
  if (isAssignedScope(grant)) {
    await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, input.lead_id);
  }
  await assertOptionalTenantOwnedRow({ supabase, table: 'projects', id: input.project_id, tenantId: caller.tenantId, label: 'المشروع' });
  await assertOptionalTenantOwnedRow({ supabase, table: 'unit_types', id: input.unit_type_id, tenantId: caller.tenantId, label: 'نوع الوحدة' });
  await assertOptionalTenantOwnedRow({ supabase, table: 'assets', id: input.asset_id, tenantId: caller.tenantId, label: 'العقار' });
  await assertOptionalTenantOwnedRow({ supabase, table: 'listings', id: input.listing_id, tenantId: caller.tenantId, label: 'العرض العقاري' });

  const { data, error } = await supabase.from('lead_interests').insert({ ...input, tenant_id: caller.tenantId }).select().single();
  if (error) throw new Error(error.message);
  return okResponse({ interest: data }, 201);
});
