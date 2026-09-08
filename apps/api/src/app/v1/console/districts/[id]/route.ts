import { districtUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const input = districtUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('districts').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23503') {
      throw new ApiError(400, 'invalid_city', 'المدينة المحددة غير موجودة');
    }
    throw new Error(`Failed to update district: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'district_not_found', 'الحي غير موجود');
  }

  return okResponse({ district: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);

  const { data, error } = await supabase.from('districts').delete().eq('id', id).select().maybeSingle();
  if (error) {
    // Referenced by properties/projects/buildings (district_id, no cascade) — a clear 409 instead of a raw FK error.
    if (error.code === '23503') {
      throw new ApiError(409, 'district_in_use', 'لا يمكن حذف حي مرتبط بعقارات أو مشاريع قائمة');
    }
    throw new Error(`Failed to delete district: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'district_not_found', 'الحي غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
