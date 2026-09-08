import { projectUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load project: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
  }

  return okResponse({ project: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تعديل المشاريع');
  }

  const input = projectUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('projects').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
  }

  return okResponse({ project: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية حذف المشاريع');
  }

  const { data, error } = await supabase.from('projects').delete().eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
