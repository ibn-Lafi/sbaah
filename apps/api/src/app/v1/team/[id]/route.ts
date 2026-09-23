import { createServiceRoleClient, updateTeamMemberSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwnerOrAdmin } from '@/lib/auth/assert-owner-or-admin';
import { setAuthUserBanned } from '@/lib/auth/auth-user-ban';

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
    .select('id, role, status, auth_user_id')
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

  // Ban before revoking in the database, so a failure leaves the member
  // exactly as they were instead of half-disabled.
  const accessChange =
    input.status !== undefined && (input.status === 'disabled') !== (target.status === 'disabled')
      ? { banned: input.status === 'disabled', serviceRole: createServiceRoleClient() }
      : null;
  if (accessChange) {
    await setAuthUserBanned(accessChange.serviceRole, target.auth_user_id, accessChange.banned);
  }

  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', id)
    .select('id, full_name, phone, email, role, status, created_at')
    .single();
  if (error) {
    if (accessChange) {
      await setAuthUserBanned(accessChange.serviceRole, target.auth_user_id, !accessChange.banned).catch((rollbackError) =>
        console.error('Failed to roll back auth ban after team member update failed', rollbackError),
      );
    }
    throw new Error(`Failed to update team member: ${error.message}`);
  }

  return okResponse({ member: data });
});
