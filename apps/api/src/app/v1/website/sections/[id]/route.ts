import { sectionUpdateSchema } from '@sbaah/shared';
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

  const input = sectionUpdateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('website_sections')
    .update(input)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update section: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'section_not_found', 'القسم غير موجود');
  }

  return okResponse({ section: data });
});
