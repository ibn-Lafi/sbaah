import { leadUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { sendEmail } from '@/lib/email/send';
import { newLeadAssignedEmail } from '@/lib/email/templates';

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

  // Read before the update so a re-save of the same agent (or any other
  // field-only change) doesn't re-notify — only an actual assignment
  // change should email the agent.
  const { data: previous } = await supabase.from('leads').select('assigned_agent_id').eq('id', id).maybeSingle();

  const { data, error } = await supabase.from('leads').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'lead_not_found', 'العميل المحتمل غير موجود');
  }

  const agentAssignmentChanged =
    input.assigned_agent_id != null && input.assigned_agent_id !== previous?.assigned_agent_id;
  if (agentAssignmentChanged) {
    // Best-effort, mirrors team/invite/route.ts — the assignment itself
    // already succeeded above, a flaky email provider shouldn't fail it.
    const { data: agent } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', input.assigned_agent_id as string)
      .maybeSingle();
    if (agent?.email) {
      try {
        await sendEmail({
          to: agent.email,
          ...newLeadAssignedEmail({ agentName: agent.full_name, leadName: data.full_name, leadPhone: data.phone }),
        });
      } catch (emailError) {
        console.error('Failed to send new-lead-assigned email', emailError);
      }
    }
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
