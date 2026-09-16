import { planUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const input = planUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('plans').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update plan: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'plan_not_found', 'الباقة غير موجودة');
  }

  return okResponse({ plan: data });
});

/**
 * tenants.plan_id and payments.plan_id are both `not null` with no cascade
 * (migrations 0001/0027) — a plan already assigned to an account or referenced
 * by a past payment can't be hard-deleted (FK block), same pattern as
 * cities/[id]'s DELETE. Retiring such a plan is still `is_active: false` via
 * the PATCH above; this DELETE only succeeds for a plan nothing references
 * (e.g. one created by mistake and never offered).
 */
export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);

  const { data, error } = await supabase.from('plans').delete().eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23503') {
      throw new ApiError(
        409,
        'plan_in_use',
        'لا يمكن حذف هذه الباقة لأنها مرتبطة بحسابات أو عمليات دفع حالية — أوقفها بدلًا من ذلك (خانة "نشطة" بنموذج التعديل)',
      );
    }
    throw new Error(`Failed to delete plan: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'plan_not_found', 'الباقة غير موجودة');
  }

  return okResponse({ status: 'deleted' });
});
