import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

interface RouteContext { params: Promise<{ id: string }>; }

const inputSchema = z.object({
  project_id: z.string().uuid().nullable().optional(),
  unit_type_id: z.string().uuid().nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  listing_id: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
}).superRefine((value, ctx) => {
  const targets = [value.project_id, value.unit_type_id, value.asset_id, value.listing_id].filter(Boolean);
  if (targets.length !== 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'يجب اختيار مشروع أو نموذج أو عقار أو عرض واحد فقط' });
});

export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.update');
  if (isAssignedScope(grant)) await assertAssignedLeadAccess(supabase, caller.tenantId, caller.userId, id);
  const input = inputSchema.parse(await request.json());

  const { data: lead } = await supabase.from('leads').select('id').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (!lead) throw new ApiError(404, 'lead_not_found', 'العميل غير موجود');

  const checks: Array<[string, string | null | undefined]> = [
    ['projects', input.project_id], ['unit_types', input.unit_type_id], ['assets', input.asset_id], ['listings', input.listing_id],
  ];
  for (const [table, targetId] of checks) {
    if (!targetId) continue;
    const { data: target, error } = await supabase.from(table).select('id').eq('id', targetId).eq('tenant_id', caller.tenantId).maybeSingle();
    if (error) throw new Error(`Failed to validate interest target: ${error.message}`);
    if (!target) throw new ApiError(400, 'invalid_interest_target', 'الهدف العقاري غير موجود');
  }

  const { data, error } = await supabase.from('lead_interests').insert({ tenant_id: caller.tenantId, lead_id: id, ...input }).select().single();
  if (error) throw new Error(`Failed to create lead interest: ${error.message}`);
  return okResponse({ interest: data }, 201);
});
