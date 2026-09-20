import { assetUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext { params: Promise<{ id: string }>; }

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const { data, error } = await supabase.from('assets').select('*, asset_media(*)').eq('id', id).maybeSingle();
  if (error) throw new Error(`Failed to load asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ asset: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تعديل العقارات');
  const input = assetUpdateSchema.parse(await request.json());
  const { data, error } = await supabase.from('assets').update(input).eq('id', id).select().maybeSingle();
  if (error) throw new Error(`Failed to update asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ asset: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية أرشفة العقارات');
  const { data, error } = await supabase.from('assets').update({ archived_at: new Date().toISOString() }).eq('id', id).select('id').maybeSingle();
  if (error) throw new Error(`Failed to archive asset: ${error.message}`);
  if (!data) throw new ApiError(404, 'asset_not_found', 'العقار غير موجود');
  return okResponse({ status: 'archived' });
});
