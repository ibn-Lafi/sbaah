import { themeUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * No DELETE and no `key`/no way to change it here: a theme's `key` is a
 * code reference (public-site's theme registry), not console-managed
 * data — deleting or renaming a `key` would silently break the site of
 * every tenant currently on that theme.
 */
export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);
  const input = themeUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('themes').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update theme: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'theme_not_found', 'الثيم غير موجود');
  }

  return okResponse({ theme: data });
});
