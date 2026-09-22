import { assetUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext { params: Promise<{ id: string }>; }

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { data, error } = await supabase.from('assets').select('*, asset_media(*)').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (error) throw new Error(`Failed to load asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  const [parentResult, childrenResult, availabilityResult] = await Promise.all([
    data.parent_asset_id
      ? supabase.from('assets').select('*').eq('id', data.parent_asset_id).eq('tenant_id', caller.tenantId).is('archived_at', null).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('assets').select('*').eq('parent_asset_id', id).eq('tenant_id', caller.tenantId).is('archived_at', null).order('created_at'),
    supabase.rpc('get_asset_commercial_availability', { p_tenant_id: caller.tenantId, p_asset_id: id }).maybeSingle(),
  ]);
  if (parentResult.error) throw new Error(`Failed to load parent asset: ${parentResult.error.message}`);
  if (childrenResult.error) throw new Error(`Failed to load child assets: ${childrenResult.error.message}`);
  if (availabilityResult.error) throw new Error(`Failed to load asset availability: ${availabilityResult.error.message}`);
  return okResponse({ asset: data, parent: parentResult.data, children: childrenResult.data ?? [], availability: availabilityResult.data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تعديل العقارات');
  const input = assetUpdateSchema.parse(await request.json());
  if (input.parent_asset_id) {
    const { data: parent, error: parentError } = await supabase.from('assets').select('id').eq('id', input.parent_asset_id).eq('tenant_id', caller.tenantId).is('archived_at', null).maybeSingle();
    if (parentError) throw new Error(`Failed to validate parent asset: ${parentError.message}`);
    if (!parent) throw new ApiError(400, 'invalid_parent_asset', 'العقار الرئيسي غير موجود أو مؤرشف');
  }
  const { data, error } = await supabase.from('assets').update(input).eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
  if (error) throw new Error(`Failed to update asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ asset: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية أرشفة العقارات');
  const { count: childrenCount, error: childrenError } = await supabase.from('assets').select('id', { count: 'exact', head: true }).eq('parent_asset_id', id).eq('tenant_id', caller.tenantId).is('archived_at', null);
  if (childrenError) throw new Error(`Failed to validate child assets: ${childrenError.message}`);
  if ((childrenCount ?? 0) > 0) throw new ApiError(409, 'asset_has_children', 'انقل أو أرشف العقارات التابعة أولًا');
  const { data, error } = await supabase.from('assets').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', caller.tenantId).select('id').maybeSingle();
  if (error) throw new Error(`Failed to archive asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ status: 'archived' });
});
