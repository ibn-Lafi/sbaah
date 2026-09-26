import type { NextRequest } from 'next/server';
import { assetInputSchema, assetSearchSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const input = assetSearchSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const { page, page_size, scope, ...filters } = input;
  let query = supabase.from('assets').select('*', { count: 'exact' }).eq('tenant_id', caller.tenantId).is('archived_at', null);
  for (const [key, value] of Object.entries(filters)) if (value != null) query = query.eq(key, value);
  // A unit is still an Asset: it is a child of another asset (e.g. building → apartment)
  // or a concrete project unit tied to a unit type. Keep one source of truth in `assets`.
  if (scope === 'units') query = query.or('parent_asset_id.not.is.null,unit_type_id.not.is.null');
  // The main Properties page is an index of independent roots only. Project
  // inventory and child units are browsed from their owning project/property.
  if (scope === 'top_level') query = query.is('project_id', null).is('parent_asset_id', null);
  const from = (page - 1) * page_size;
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + page_size - 1);
  if (error) throw new Error(`Failed to list assets: ${error.message}`);
  return okResponse({ assets: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة عقارات');
  const input = assetInputSchema.parse(await request.json());
  let effectiveProjectId=input.project_id??null;
  if (input.parent_asset_id) {
    const { data: parent, error: parentError } = await supabase.from('assets').select('id,project_id,parent_asset_id').eq('id', input.parent_asset_id).eq('tenant_id', caller.tenantId).is('archived_at', null).maybeSingle();
    if (parentError) throw new Error(`Failed to validate parent asset: ${parentError.message}`);
    if (!parent) throw new ApiError(400, 'invalid_parent_asset', 'العقار الرئيسي غير موجود أو مؤرشف');
    if (parent.parent_asset_id) throw new ApiError(400, 'unit_cannot_have_children', 'لا يمكن إضافة وحدة تابعة لوحدة أخرى');
    if (input.project_id && parent.project_id && input.project_id !== parent.project_id) throw new ApiError(400, 'parent_project_mismatch', 'العقار الرئيسي مرتبط بمشروع مختلف');
    effectiveProjectId=parent.project_id??effectiveProjectId;
  }
  if (effectiveProjectId) {
    const { data: project, error: projectError } = await supabase.from('projects').select('id,status').eq('id', effectiveProjectId).eq('tenant_id', caller.tenantId).maybeSingle();
    if (projectError) throw new Error(`Failed to validate project: ${projectError.message}`);
    if (!project || project.status === 'archived') throw new ApiError(400, 'invalid_project', 'المشروع غير موجود أو مؤرشف');
  }
  if (input.phase_id) {
    if (!effectiveProjectId) throw new ApiError(400, 'phase_requires_project', 'لا يمكن ربط مرحلة بدون مشروع');
    const { data: phase, error: phaseError } = await supabase.from('project_phases').select('id,project_id').eq('id', input.phase_id).eq('tenant_id', caller.tenantId).maybeSingle();
    if (phaseError) throw new Error(`Failed to validate project phase: ${phaseError.message}`);
    if (!phase || phase.project_id !== effectiveProjectId) throw new ApiError(400, 'phase_project_mismatch', 'المرحلة لا تتبع المشروع المحدد');
  }
  if (input.unit_type_id) {
    const { data: unitType, error: unitTypeError } = await supabase.from('unit_types').select('id,project_id,asset_type').eq('id', input.unit_type_id).eq('tenant_id', caller.tenantId).maybeSingle();
    if (unitTypeError) throw new Error(`Failed to validate unit type: ${unitTypeError.message}`);
    if (!unitType) throw new ApiError(400, 'invalid_unit_type', 'نوع الوحدة غير موجود');
    if (unitType.project_id && unitType.project_id !== effectiveProjectId) throw new ApiError(400, 'unit_type_project_mismatch', 'نوع الوحدة لا يتبع المشروع المحدد');
    if (unitType.asset_type && unitType.asset_type !== input.asset_type) throw new ApiError(400, 'unit_type_asset_mismatch', 'نوع العقار لا يطابق نوع الوحدة المحدد');
  }
  const { data, error } = await supabase.from('assets').insert({ ...input, project_id:effectiveProjectId, tenant_id: caller.tenantId }).select().single();
  if (error) throw new Error(`Failed to create asset: ${error.message}`);
  return okResponse({ asset: data }, 201);
});
