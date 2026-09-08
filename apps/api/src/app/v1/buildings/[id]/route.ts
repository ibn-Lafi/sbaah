import { buildingUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase.from('buildings').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load building: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'building_not_found', 'العمارة غير موجودة');
  }

  return okResponse({ building: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تعديل العمارات');
  }

  const input = buildingUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('buildings').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update building: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'building_not_found', 'العمارة غير موجودة');
  }

  return okResponse({ building: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية حذف العمارات');
  }

  const { data, error } = await supabase.from('buildings').delete().eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete building: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'building_not_found', 'العمارة غير موجودة');
  }

  return okResponse({ status: 'deleted' });
});
