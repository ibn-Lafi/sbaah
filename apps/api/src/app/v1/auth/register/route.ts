import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createServiceRoleClient, registerSchema, REGISTRATION_OPEN, type TenantRegistrationInput } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyTempToken } from '@/lib/auth/temp-token';
import { mintSessionForUser } from '@/lib/auth/mint-session';
import { generateUniqueSubdomain } from '@/lib/tenant/subdomain';

/**
 * No English name is collected at signup — the Arabic name doubles as a
 * placeholder for name_en until settings lets the owner translate it
 * (not built yet). For individual accounts the tenant's own display name
 * and the Owner user's full_name are the same value (it's one person);
 * for institution/company the entity name (tenant) and the registering
 * person's name (Owner user) are genuinely different fields.
 */
function tenantDisplayName(account: TenantRegistrationInput): string {
  return account.account_type === 'individual' ? account.full_name : account.name_ar;
}

function ownerFullName(account: TenantRegistrationInput): string {
  return account.account_type === 'individual' ? account.full_name : account.owner_full_name;
}

function orgFields(account: TenantRegistrationInput): { cr_number: string | null; tax_number: string | null } {
  return account.account_type === 'individual'
    ? { cr_number: null, tax_number: null }
    : { cr_number: account.cr_number, tax_number: account.tax_number };
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  if (!REGISTRATION_OPEN) {
    throw new ApiError(503, 'registration_closed', 'التسجيل الجديد متوقف مؤقتًا، سيعاد فتحه قريبًا');
  }

  const { registration_token, password, account, plan_id } = registerSchema.parse(await request.json());

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

  // Registration step 6 (اختر باقة وادفع) — the chosen plan must be a
  // real, currently-active plan; no more silent default-to-Basic.
  const { data: chosenPlan, error: planError } = await supabase
    .from('plans')
    .select('id')
    .eq('id', plan_id)
    .eq('is_active', true)
    .maybeSingle();
  if (planError) {
    throw new Error(`Failed to load chosen plan for registration: ${planError.message}`);
  }
  if (!chosenPlan) {
    throw new ApiError(400, 'invalid_plan', 'الباقة المختارة غير متاحة، اختر باقة أخرى');
  }

  const displayName = tenantDisplayName(account);
  const subdomain = await generateUniqueSubdomain(displayName, supabase);
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

  const { cr_number, tax_number } = orgFields(account);

  const { data: created, error: createError } = await supabase.rpc('create_tenant_with_owner', {
    p_name_ar: displayName,
    p_name_en: displayName,
    p_account_type: account.account_type,
    p_fal_license_number: account.fal_license_number,
    p_cr_number: cr_number,
    p_tax_number: tax_number,
    p_subdomain: subdomain,
    p_plan_id: chosenPlan.id,
    p_auth_user_id: authUserId,
    p_owner_full_name: ownerFullName(account),
    p_owner_phone: phone,
  });

  if (createError || !created || created.length === 0) {
    // Compensating rollback — the Postgres side failed after the auth
    // user already exists (no shared transaction across GoTrue/Postgres).
    await supabase.auth.admin.deleteUser(authUserId);
    throw new Error(`Failed to create tenant/owner during registration: ${createError?.message}`);
  }

  const session = await mintSessionForUser(supabase, authUserId);

  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    tenant_id: created[0].tenant_id,
    subdomain,
  });
});
