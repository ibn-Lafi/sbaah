import { leadUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase
    .from('leads')
    .select('*, lead_notes(*)')
    .eq('id', id)
    .order('created_at', { foreignTable: 'lead_notes', ascending: false })
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  return okResponse({ lead: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const input = leadUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('leads').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  return okResponse({ lead: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  // No agent DELETE policy on `leads` (migration 0005).
  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية حذف عملاء محتملين');
  }

  const { data, error } = await supabase.from('leads').delete().eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
