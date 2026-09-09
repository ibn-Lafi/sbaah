import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceRoleClient, inviteTeamMemberSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwnerOrAdmin } from '@/lib/auth/assert-owner-or-admin';

/**
 * Invited members get no password here — they authenticate later via the
 * existing OTP login flow (purpose: 'login'), which only checks that a
 * `users` row exists for the phone. Their status starts 'invited' and
 * flips to 'active' on that first successful login (see otp/verify and
 * reset-password routes).
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase: callerSupabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(callerSupabase);
  assertOwnerOrAdmin(caller.role);

  const input = inviteTeamMemberSchema.parse(await request.json());
  const supabase = createServiceRoleClient();

  const { data: existingUser } = await supabase.from('users').select('id').eq('phone', input.phone).maybeSingle();
  if (existingUser) {
    throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل على المنصة');
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('status, plan_id, plans(max_users)')
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Failed to load tenant plan for team invite: ${tenantError?.message}`);
  }
  // Uses the service role (createUser needs Admin API), which bypasses the
  // RLS write-lock from migration 0019 — check status explicitly here,
  // the one write path in this app that isn't already covered by it.
  if (tenant.status !== 'active') {
    throw new ApiError(403, 'tenant_not_active', 'الحساب معلَّق حاليًا، لا يمكن دعوة أعضاء جدد');
  }
  const maxUsers = (tenant.plans as unknown as { max_users: number } | null)?.max_users;
  if (typeof maxUsers !== 'number') {
    throw new Error('Failed to load plan max_users for team invite');
  }

  const { count: currentUserCount, error: countError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', caller.tenantId)
    .neq('status', 'disabled');
  if (countError) {
    throw new Error(`Failed to count current team members: ${countError.message}`);
  }
  if ((currentUserCount ?? 0) >= maxUsers) {
    throw new ApiError(
      403,
      'plan_user_limit_reached',
      'وصل عدد أعضاء الفريق للحد الأقصى المسموح به في باقتك الحالية',
    );
  }

  const internalEmail = `u_${randomUUID()}@internal.sbaah.app`;
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    phone: input.phone,
    email: internalEmail,
    phone_confirm: true,
    email_confirm: true,
  });
  if (authError || !authUser?.user) {
    throw new Error(`Failed to create auth user during team invite: ${authError?.message}`);
  }
  const authUserId = authUser.user.id;

  const { data: created, error: createError } = await supabase
    .from('users')
    .insert({
      tenant_id: caller.tenantId,
      auth_user_id: authUserId,
      full_name: input.full_name,
      phone: input.phone,
      role: input.role,
      status: 'invited',
    })
    .select('id, full_name, phone, role, status, created_at')
    .single();
  if (createError || !created) {
    // Compensating rollback — mirrors register/route.ts (no shared
    // transaction across GoTrue/Postgres).
    await supabase.auth.admin.deleteUser(authUserId);
    if (createError?.code === '23505') {
      throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل على المنصة');
    }
    throw new Error(`Failed to create team member during invite: ${createError?.message}`);
  }

  return okResponse({ member: created });
});
