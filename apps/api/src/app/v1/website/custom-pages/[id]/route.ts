import { websiteCustomPageUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = websiteCustomPageUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('website_custom_pages').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'slug_taken', 'رابط الصفحة هذا مستخدَم بالفعل، اختر رابطًا آخر');
    }
    throw new Error(`Failed to update custom page: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'page_not_found', 'الصفحة غير موجودة');
  }

  return okResponse({ page: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { error } = await supabase.from('website_custom_pages').delete().eq('id', id);
  if (error) {
    throw new Error(`Failed to delete custom page: ${error.message}`);
  }

  return okResponse({ status: 'deleted' });
});
