import { updateTeamMemberSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwnerOrAdmin } from '@/lib/auth/assert-owner-or-admin';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Owner is exactly one per tenant, set at registration and never edited
 * here (no 'owner' value in updateTeamMemberSchema) — this also blocks
 * an Admin from demoting/disabling the Owner, since the current row's
 * role is checked before any update is applied.
 */
export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwnerOrAdmin(caller.role);

  const input = updateTeamMemberSchema.parse(await request.json());

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle();
  if (targetError) {
    throw new Error(`Failed to load team member: ${targetError.message}`);
  }
  if (!target) {
    throw new ApiError(404, 'member_not_found', 'العضو غير موجود');
  }
  if (target.role === 'owner') {
    throw new ApiError(403, 'cannot_edit_owner', 'لا يمكن تعديل مالك الحساب من هنا');
  }
  if (target.id === caller.userId) {
    throw new ApiError(403, 'cannot_edit_self', 'لا يمكنك تعديل صلاحياتك الخاصة');
  }

  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', id)
    .select('id, full_name, phone, role, status, created_at')
    .single();
  if (error) {
    throw new Error(`Failed to update team member: ${error.message}`);
  }

  return okResponse({ member: data });
});
