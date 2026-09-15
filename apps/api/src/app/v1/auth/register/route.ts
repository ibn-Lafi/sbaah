import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceRoleClient, registerSchema, REGISTRATION_OPEN } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyTempToken } from '@/lib/auth/temp-token';
import { mintSessionForUser } from '@/lib/auth/mint-session';
import { generateUniqueSubdomain } from '@/lib/tenant/subdomain';

const TRIAL_DAYS = 14;

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!REGISTRATION_OPEN) {
    throw new ApiError(503, 'registration_closed', 'التسجيل الجديد متوقف مؤقتًا، سيعاد فتحه قريبًا');
  }

  const { registration_token, password, full_name, email, account_type, plan_id } = registerSchema.parse(
    await request.json(),
  );

  let payload;
  try {
    payload = await verifyTempToken(registration_token);
  } catch {
    throw new ApiError(401, 'invalid_registration_token', 'رابط التسجيل غير صالح أو منتهي، ابدأ التسجيل من جديد');
  }
  if (payload.purpose !== 'register') {
    throw new ApiError(401, 'invalid_registration_token', 'رابط التسجيل غير صالح أو منتهي، ابدأ التسجيل من جديد');
  }
  const phone = payload.phone;

  const supabase = createServiceRoleClient();

  const { data: existingUser } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
  if (existingUser) {
    throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل');
  }

  // Registration's last step (اختر باقتك) — the chosen plan must be a
  // real, currently-active plan; no more silent default-to-Basic. Also
  // tells us whether this is the one free-trial plan (migration 0047),
  // which skips StreamPay checkout entirely.
  const { data: chosenPlan, error: planError } = await supabase
    .from('plans')
    .select('id, is_trial')
    .eq('id', plan_id)
    .eq('is_active', true)
    .maybeSingle();
  if (planError) {
    throw new Error(`Failed to load chosen plan for registration: ${planError.message}`);
  }
  if (!chosenPlan) {
    throw new ApiError(400, 'invalid_plan', 'الباقة المختارة غير متاحة، اختر باقة أخرى');
  }

  // No English name is collected at signup — the Arabic name doubles as
  // a placeholder for name_en until settings lets the owner translate it.
  // For institution/company this `full_name` is a placeholder too: the
  // entity's real name (اسم المؤسسة/الشركة), CR number, tax number, and
  // فال license are no longer collected here at all (migration 0047) —
  // filled in later from حسابي. The account works fully in the
  // meantime; only its public site won't publish until then.
  const subdomain = await generateUniqueSubdomain(full_name, supabase);
  const internalEmail = `u_${randomUUID()}@internal.sbaah.app`;

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    phone,
    email: internalEmail,
    password,
    phone_confirm: true,
    email_confirm: true,
  });
  if (authError || !authUser?.user) {
    throw new Error(`Failed to create auth user during registration: ${authError?.message}`);
  }
  const authUserId = authUser.user.id;

  const trialEndsAt = chosenPlan.is_trial
    ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: created, error: createError } = await supabase.rpc('create_tenant_with_owner', {
    p_name_ar: full_name,
    p_name_en: full_name,
    p_account_type: account_type,
    p_subdomain: subdomain,
    p_plan_id: chosenPlan.id,
    p_trial_ends_at: trialEndsAt,
    p_auth_user_id: authUserId,
    p_owner_full_name: full_name,
    p_owner_phone: phone,
    p_owner_email: email,
  });

  if (createError || !created || created.length === 0) {
    // Compensating rollback — the Postgres side failed after the auth
    // user already exists (no shared transaction across GoTrue/Postgres).
    await supabase.auth.admin.deleteUser(authUserId);
    if (createError?.code === '23505') {
      throw new ApiError(409, 'email_already_used', 'هذا البريد الإلكتروني مستخدم لحساب آخر');
    }
    throw new Error(`Failed to create tenant/owner during registration: ${createError?.message}`);
  }

  const session = await mintSessionForUser(supabase, authUserId);

  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    tenant_id: created[0].tenant_id,
    subdomain,
    is_trial: chosenPlan.is_trial,
  });
});
