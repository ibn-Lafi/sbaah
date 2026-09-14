import type { NextRequest } from 'next/server';
import { updateMyEmailSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

/**
 * The caller's own identity — dashboard's AppShell needs this to render
 * (org name, account-type badge, role label) and to tell "logged in but
 * no session yet" apart from "logged in successfully" (task 24/42).
 * `caller.tenantId`/`userId` already come from a verified JWT
 * (getCallerContext), so both selects below are exact-own-row lookups,
 * not user input.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, phone, email, role, status')
    .eq('id', caller.userId)
    .single();
  if (userError || !user) {
    throw new Error(`Failed to load current user: ${userError?.message}`);
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select(
      'id, name_ar, name_en, account_type, subdomain, custom_domain, status, cr_number, tax_number, fal_license_number, social_instagram, social_tiktok, social_whatsapp, social_snapchat, social_phone',
    )
    .eq('id', caller.tenantId)
    .single();
  if (tenantError || !tenant) {
    throw new Error(`Failed to load current tenant: ${tenantError?.message}`);
  }

  return okResponse({ user, tenant });
});

/**
 * Every user edits their own email from "حسابي" — not an Owner/Admin-only
 * action like the tenant-level cards on that page, since it identifies
 * the person, not the account. Also the email this same user will later
 * use for email-OTP login/reset, so it must stay unique (migration 0040).
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { email } = updateMyEmailSchema.parse(await request.json());

  const { data: user, error } = await supabase
    .from('users')
    .update({ email })
    .eq('id', caller.userId)
    .select('id, full_name, phone, email, role, status')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'email_already_used', 'هذا البريد الإلكتروني مستخدم لحساب آخر');
    }
    throw new Error(`Failed to update email: ${error.message}`);
  }

  return okResponse({ user });
});
