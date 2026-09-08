import { addLeadNoteSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id: leadId } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { note_text } = addLeadNoteSchema.parse(await request.json());

  // user_id always comes from the caller's own resolved identity, never
  // from the request body — otherwise anyone with write access could
  // author a note in someone else's name (RLS scopes which lead_id is
  // reachable, not who a note claims to be written by).
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({ lead_id: leadId, user_id: caller.userId, note_text })
    .select()
    .single();
  if (error) {
    // 42501 = RLS rejected it (lead exists but isn't this caller's to
    // write notes on); 23503 = the foreign key itself failed (lead_id
    // doesn't exist at all). Same 404 either way — no existence leak.
    if (error.code === '42501' || error.code === '23503') {
      throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
    }
    throw new Error(`Failed to add lead note: ${error.message}`);
  }

  return okResponse({ note: data }, 201);
});
