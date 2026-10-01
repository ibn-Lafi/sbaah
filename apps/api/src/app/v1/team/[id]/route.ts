import type { NextRequest } from 'next/server';
import { createServiceRoleClient, updateTeamMemberSchema, type Permission } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

async function requireTeamManage(scoped: ReturnType<typeof getAuthenticatedClient>['supabase']) {
  const { data, error } = await scoped.rpc('auth_has_permission', { check_permission: 'team.manage' });
  if (error) throw new Error(`Failed to check team permission: ${error.message}`);
  if (!data) throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لإدارة الفريق');
}

async function assertGrantSubset(caller: Awaited<ReturnType<typeof getCallerContext>>, permissions: Permission[]) {
  if (caller.role === 'owner') return;
  const service = createServiceRoleClient();
  const { data, error } = await service.from('user_permission_grants').select('permission').eq('user_id', caller.userId);
  if (error) throw new Error(`Failed to load caller grants: ${error.message}`);
  const owned = new Set((data ?? []).map((row) => row.permission));
  if (permissions.some((permission) => !owned.has(permission))) {
    throw new ApiError(403, 'cannot_delegate_permission', 'لا يمكنك منح صلاحية لا تملكها');
  }
}

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await requireTeamManage(supabase);

  const { id } = await context.params;
  const input = updateTeamMemberSchema.parse(await request.json());
  const service = createServiceRoleClient();

  const { data: target, error: targetError } = await service
    .from('users')
    .select('id, tenant_id, auth_user_id, role, status')
    .eq('id', id)
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();
  if (targetError) throw new Error(`Failed to load team member: ${targetError.message}`);
  if (!target) throw new ApiError(404, 'member_not_found', 'عضو الفريق غير موجود');
  if (target.role === 'owner') throw new ApiError(403, 'owner_immutable', 'لا يمكن تعديل مالك الحساب من إدارة الفريق');
  if (target.id === caller.userId && input.status === 'disabled') {
    throw new ApiError(400, 'cannot_disable_self', 'لا يمكنك تعطيل حسابك بنفسك');
  }

  if (input.permissions) await assertGrantSubset(caller, input.permissions);

  const updates: Record<string, string> = {};
  if (input.full_name !== undefined) updates.full_name = input.full_name;
  if (input.status !== undefined) updates.status = input.status;

  if (Object.keys(updates).length > 0) {
    const { error } = await service
      .from('users')
      .update(updates)
      .eq('id', target.id)
      .eq('tenant_id', caller.tenantId);
    if (error) throw new Error(`Failed to update team member: ${error.message}`);
  }

  if (input.permissions) {
    const { error: deleteError } = await service.from('user_permission_grants').delete().eq('user_id', target.id);
    if (deleteError) throw new Error(`Failed to replace team grants: ${deleteError.message}`);
    if (input.permissions.length > 0) {
      const { error: insertError } = await service.from('user_permission_grants').insert(
        input.permissions.map((permission) => ({ user_id: target.id, permission, data_scope: 'organization' })),
      );
      if (insertError) throw new Error(`Failed to save team grants: ${insertError.message}`);
    }
  }

  // Revokes refresh tokens when a member is disabled. RLS also denies any
  // still-live access token immediately because users.status is checked.
  if (input.status === 'disabled') {
    await service.auth.admin.signOut(target.auth_user_id);
  }

  const [{ data: member, error: memberError }, { data: grants, error: grantsError }] = await Promise.all([
    service
      .from('users')
      .select('id, full_name, phone, email, role, status, must_change_password, created_at')
      .eq('id', target.id)
      .single(),
    service
    .from('user_permission_grants')
    .select('permission')
    .eq('user_id', target.id),
  ]);
  if (memberError || !member) throw new Error(`Failed to reload team member: ${memberError?.message}`);
  if (grantsError) throw new Error(`Failed to reload team grants: ${grantsError.message}`);

  return okResponse({ member: { ...member, permissions: (grants ?? []).map((grant) => grant.permission) } });
});
