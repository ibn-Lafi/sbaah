import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceRoleClient, createTeamMemberSchema, PERMISSIONS, type Permission } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

async function requirePermission(scoped: ReturnType<typeof getAuthenticatedClient>['supabase'], permission: Permission, legacy?: Permission) {
  const { data, error } = await scoped.rpc('auth_has_permission', { check_permission: permission });
  if (error) throw new Error(`Failed to check permission: ${error.message}`);
  if (data) return;
  if (legacy) {
    const fallback = await scoped.rpc('auth_has_permission', { check_permission: legacy });
    if (fallback.error) throw new Error(`Failed to check legacy permission: ${fallback.error.message}`);
    if (fallback.data) return;
  }
  throw new ApiError(403, 'forbidden', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
}

async function assertGrantSubset(caller: Awaited<ReturnType<typeof getCallerContext>>, permissions: Permission[]) {
  if (caller.role === 'owner') return;
  const service = createServiceRoleClient();
  const { data, error } = await service
    .from('user_permission_grants')
    .select('permission')
    .eq('user_id', caller.userId);
  if (error) throw new Error(`Failed to load caller grants: ${error.message}`);
  const owned = new Set((data ?? []).map((row) => row.permission));
  if (permissions.some((permission) => !owned.has(permission))) {
    throw new ApiError(403, 'cannot_delegate_permission', 'لا يمكنك منح صلاحية لا تملكها');
  }
}

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await requirePermission(supabase, 'team.read');

  const service = createServiceRoleClient();
  const { data: members, error } = await service
    .from('users')
    .select('id, full_name, phone, email, role, status, must_change_password, created_at')
    .eq('tenant_id', caller.tenantId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`Failed to list team: ${error.message}`);

  const ids = (members ?? []).map((member) => member.id);
  const { data: grants, error: grantsError } = ids.length
    ? await service.from('user_permission_grants').select('user_id, permission, data_scope').in('user_id', ids)
    : { data: [], error: null };
  if (grantsError) throw new Error(`Failed to list team grants: ${grantsError.message}`);

  const byUser = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    const current = byUser.get(grant.user_id) ?? [];
    current.push(grant.permission);
    byUser.set(grant.user_id, current);
  }

  return okResponse({
    members: (members ?? []).map((member) => ({
      ...member,
      permissions: member.role === 'owner' ? [...PERMISSIONS] : (byUser.get(member.id) ?? []),
    })),
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  await requirePermission(supabase, 'team.create', 'team.manage');

  const input = createTeamMemberSchema.parse(await request.json());
  await assertGrantSubset(caller, input.permissions);

  const service = createServiceRoleClient();

  const { data: tenant, error: tenantError } = await service
    .from('tenants')
    .select('plan_id')
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) throw new Error(`Failed to load tenant plan: ${tenantError?.message}`);

  const [{ data: plan, error: planError }, { count, error: countError }] = await Promise.all([
    service.from('plans').select('max_users').eq('id', tenant.plan_id).single(),
    service.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', caller.tenantId).neq('status', 'disabled'),
  ]);
  if (planError || !plan) throw new Error(`Failed to load plan limits: ${planError?.message}`);
  if (countError) throw new Error(`Failed to count team members: ${countError.message}`);
  if ((count ?? 0) >= plan.max_users) {
    throw new ApiError(409, 'team_limit_reached', 'وصلت للحد الأقصى لعدد أعضاء الفريق في باقتك');
  }

  const { data: duplicate, error: duplicateError } = await service
    .from('users')
    .select('id, phone, email')
    .or(`phone.eq.${input.phone},email.eq.${input.email}`)
    .limit(1);
  if (duplicateError) throw new Error(`Failed to check member identity: ${duplicateError.message}`);
  if ((duplicate ?? []).length > 0) {
    throw new ApiError(409, 'member_identity_used', 'رقم الجوال أو البريد الإلكتروني مستخدم بالفعل');
  }

  const internalEmail = `team_${randomUUID()}@internal.sbaah.app`;
  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    phone: input.phone,
    email: internalEmail,
    password: input.temporary_password,
    phone_confirm: true,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    if (/already|registered|exists/i.test(authError?.message ?? '')) {
      throw new ApiError(409, 'member_identity_used', 'رقم الجوال مستخدم بالفعل');
    }
    throw new Error(`Failed to create team auth user: ${authError?.message}`);
  }

  const authUserId = authUser.user.id;
  const { data: member, error: memberError } = await service
    .from('users')
    .insert({
      tenant_id: caller.tenantId,
      auth_user_id: authUserId,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      role: 'agent',
      status: 'active',
      must_change_password: true,
    })
    .select('id, full_name, phone, email, role, status, must_change_password, created_at')
    .single();

  if (memberError || !member) {
    await service.auth.admin.deleteUser(authUserId);
    if (memberError?.code === '23505') {
      throw new ApiError(409, 'member_identity_used', 'رقم الجوال أو البريد الإلكتروني مستخدم بالفعل');
    }
    throw new Error(`Failed to create team member: ${memberError?.message}`);
  }

  if (input.permissions.length > 0) {
    const { error: grantsError } = await service.from('user_permission_grants').insert(
      input.permissions.map((permission) => ({
        user_id: member.id,
        permission,
        data_scope: 'organization',
      })),
    );
    if (grantsError) {
      await service.from('users').delete().eq('id', member.id);
      await service.auth.admin.deleteUser(authUserId);
      throw new Error(`Failed to save team grants: ${grantsError.message}`);
    }
  }

  return okResponse({ member: { ...member, permissions: input.permissions } }, 201);
});
