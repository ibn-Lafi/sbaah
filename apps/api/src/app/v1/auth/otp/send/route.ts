import type { NextRequest } from 'next/server';
import { createServiceRoleClient, requestOtpSchema, REGISTRATION_OPEN, type OtpPurpose } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { sendOtpSms } from '@/lib/authentica/client';
import { sendEmail } from '@/lib/email/send';
import { otpCodeEmail } from '@/lib/email/templates';
import { accountDisabledError, getCallerContext } from '@/lib/auth/get-caller-context';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { generateOtpCode } from '@/lib/otp/generate-code';
import { hashEmailOtpCode } from '@/lib/otp/hash-email-code';
import { OTP_CONFIG } from '@/lib/otp/otp-config';
import { computeExpiresAt, hasExceededSendLimit } from '@/lib/otp/otp-policy';
import { assertOtpNotLocked, type OtpIdentifier } from '@/lib/otp/attempt-guard';

const NEW_IDENTIFIER_PURPOSES: readonly OtpPurpose[] = ['register', 'change_phone', 'change_email'];

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = requestOtpSchema.parse(await request.json());
  const { channel, purpose } = input;

  // Registration stays phone-only (docs/OTP_FLOW.md, migration 0042's
  // header) — there is no email-based account creation.
  if (channel === 'email' && (purpose === 'register' || purpose === 'change_phone')) {
    throw new ApiError(400, 'email_otp_unsupported_purpose', 'هذا الإجراء يتطلب التحقق عبر رقم الجوال');
  }
  if (channel === 'sms' && purpose === 'change_email') {
    throw new ApiError(400, 'sms_otp_unsupported_purpose', 'تغيير البريد الإلكتروني يتطلب التحقق عبر البريد نفسه');
  }
  if (purpose === 'register' && !REGISTRATION_OPEN) {
    throw new ApiError(503, 'registration_closed', 'التسجيل الجديد متوقف مؤقتًا، سيعاد فتحه قريبًا');
  }
  // Changing a phone/email is an account action: an anonymous caller must
  // not be able to make us send paid SMS/email to arbitrary new identifiers.
  if (purpose === 'change_phone' || purpose === 'change_email') {
    const { supabase: userClient } = getAuthenticatedClient(request);
    await getCallerContext(userClient);
  }

  const supabase = createServiceRoleClient();
  const identifier: OtpIdentifier =
    channel === 'sms' ? { column: 'phone', value: input.phone as string } : { column: 'email', value: input.email as string };
  const windowStart = new Date(Date.now() - OTP_CONFIG.sendWindowMs).toISOString();

  // Independent reads — no reason to make the customer wait through them
  // one at a time before the (much slower) provider call even starts.
  const [{ data: existingUser, error: existingUserError }, { data: recentSends, error: recentSendsError }] =
    await Promise.all([
      supabase.from('users').select('id, status').eq(identifier.column, identifier.value).maybeSingle(),
      supabase
        .from('otp_verifications')
        .select('id')
        .eq(identifier.column, identifier.value)
        .eq('purpose', purpose)
        .gte('created_at', windowStart),
    ]);
  if (existingUserError) throw new Error(`Failed to look up OTP recipient: ${existingUserError.message}`);
  if (recentSendsError) throw new Error(`Failed to check OTP send rate limit: ${recentSendsError.message}`);

  if (NEW_IDENTIFIER_PURPOSES.includes(purpose)) {
    if (existingUser) {
      throw channel === 'sms'
        ? new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل')
        : new ApiError(409, 'email_already_used', 'البريد الإلكتروني مستخدم لحساب آخر');
    }
  } else {
    if (!existingUser) {
      throw channel === 'sms'
        ? new ApiError(404, 'phone_not_registered', 'رقم الجوال غير مسجّل')
        : new ApiError(404, 'email_not_registered', 'البريد الإلكتروني غير مسجّل');
    }
    if (existingUser.status === 'disabled') throw accountDisabledError();
  }
  if (hasExceededSendLimit(recentSends?.length ?? 0)) {
    throw new ApiError(429, 'otp_rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }
  // A locked identifier gets no new code: resending must not reset the
  // verify budget, and there is no point paying for an SMS it cannot use.
  await assertOtpNotLocked(supabase, identifier, purpose);

  const code = generateOtpCode();
  // Deliver first: a provider failure must not invalidate the customer's
  // still-usable previous code without a replacement ever reaching them.
  if (channel === 'sms') {
    await sendOtpSms(identifier.value, code);
  } else {
    const emailPurpose = purpose as Exclude<OtpPurpose, 'register' | 'change_phone'>;
    await sendEmail({ to: identifier.value, ...otpCodeEmail({ code, purpose: emailPurpose }) });
  }

  const { data: insertedOtp, error: insertError } = await supabase
    .from('otp_verifications')
    .insert({
      channel,
      [identifier.column]: identifier.value,
      purpose,
      expires_at: computeExpiresAt(),
      ...(channel === 'email' ? { code_hash: hashEmailOtpCode(code) } : {}),
    })
    .select('id')
    .single();
  if (insertError || !insertedOtp) {
    throw new Error(`Failed to record OTP send: ${insertError?.message ?? 'missing inserted OTP row'}`);
  }

  // docs/OTP_FLOW.md section 6: at most one active code per identifier+purpose.
  const { error: invalidateError } = await supabase
    .from('otp_verifications')
    .update({ expires_at: new Date().toISOString() })
    .eq(identifier.column, identifier.value)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .neq('id', insertedOtp.id);
  if (invalidateError) {
    throw new Error(`Failed to invalidate previous OTP sends: ${invalidateError.message}`);
  }

  return okResponse({ status: 'sent' });
});
