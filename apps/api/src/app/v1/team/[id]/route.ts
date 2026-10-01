import type { NextRequest } from 'next/server';
import { createServiceRoleClient, updateTeamMemberSchema, type Permission } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

async function hasPermission(scoped: ReturnType<typeof getAuthenticatedClient>['supabase'], permission: Permission) {
  const { data, error } = await scoped.rpc('auth_has_permission', { check_permission: permission });
  if (error) throw new Error(`Failed to check team permission: ${error.message}`);
  return Boolean(data);
}

async function requireAction(scoped: ReturnType<typeof getAuthenticatedClient>['supabase'], permission: Permission) {
  if (await hasPermission(scoped, permission)) return;
  if (await hasPermission(scoped, 'team.manage')) return;
  throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لإدارة هذا الجزء من فريق العمل');
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
  const { id } = await context.params;
  const input = updateTeamMemberSchema.parse(await request.json());
  if (input.full_name !== undefined) await requireAction(supabase, 'team.update');
  if (input.status !== undefined) await requireAction(supabase, 'team.status.manage');
  if (input.permissions !== undefined) await requireAction(supabase, 'team.permissions.manage');
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


export const DELETE = withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await requireAction(supabase, 'team.delete');
  const { id } = await context.params;
  const service = createServiceRoleClient();
  const { data: target, error } = await service.from('users').select('id,tenant_id,auth_user_id,role').eq('id', id).eq('tenant_id', caller.tenantId).maybeSingle();
  if (error) throw new Error('Failed to load team member: ' + error.message);
  if (!target) throw new ApiError(404, 'member_not_found', 'عضو الفريق غير موجود');
  if (target.role === 'owner') throw new ApiError(403, 'owner_immutable', 'لا يمكن حذف مالك الحساب');
  if (target.id === caller.userId) throw new ApiError(400, 'cannot_delete_self', 'لا يمكنك حذف حسابك بنفسك');
  const { error: grantError } = await service.from('user_permission_grants').delete().eq('user_id', target.id);
  if (grantError) throw new Error('Failed to revoke team grants: ' + grantError.message);
  const { error: deleteError } = await service.from('users').delete().eq('id', target.id).eq('tenant_id', caller.tenantId);
  if (deleteError) throw new ApiError(409, 'member_has_history', 'تعذر حذف الموظف نهائيًا لوجود بيانات مرتبطة به. أعد إسناد بياناته أولًا ثم حاول مرة أخرى.');
  const { error: authError } = await service.auth.admin.deleteUser(target.auth_user_id, false);
  if (authError) throw new Error('Failed to delete member login: ' + authError.message);
  return okResponse({ deleted: true, id: target.id });
});
