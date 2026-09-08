import { cityUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const input = cityUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('cities').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update city: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'city_not_found', 'المدينة غير موجودة');
  }

  return okResponse({ city: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);

  const { data, error } = await supabase.from('cities').delete().eq('id', id).select().maybeSingle();
  if (error) {
    // Referenced by properties/projects/buildings (city_id not null there,
    // no cascade) — a clear 409 instead of a raw FK error.
    if (error.code === '23503') {
      throw new ApiError(409, 'city_in_use', 'لا يمكن حذف مدينة مرتبطة بعقارات أو مشاريع قائمة');
    }
    throw new Error(`Failed to delete city: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'city_not_found', 'المدينة غير موجودة');
  }

  return okResponse({ status: 'deleted' });
});
