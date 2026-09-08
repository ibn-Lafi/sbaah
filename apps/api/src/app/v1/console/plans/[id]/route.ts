import { planUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * No DELETE: tenants.plan_id is `not null`, so a plan already assigned to
 * an account can't be hard-deleted anyway (FK block) — retiring a plan is
 * `is_active: false` via this PATCH instead, so new signups stop offering
 * it while existing accounts on it are unaffected.
 */
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
