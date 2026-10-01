import { projectUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { requireUserPermission } from '@/lib/auth/permissions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  await requireUserPermission(supabase, 'projects.read');
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).eq('tenant_id', caller.tenantId).neq('status', 'archived').maybeSingle();
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

  await requireUserPermission(supabase, 'projects.update');

  const input = projectUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('projects').update(input).eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
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

  await requireUserPermission(supabase, 'projects.archive');

  const { data, error } = await supabase.from('projects').update({ status: 'archived' }).eq('id', id).eq('tenant_id', caller.tenantId).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to archive project: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
  }

  return okResponse({ status: 'archived' });
});
