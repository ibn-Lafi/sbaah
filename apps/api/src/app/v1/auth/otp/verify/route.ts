import type { NextRequest } from 'next/server';
import { createServiceRoleClient, verifyOtpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyOtpSms } from '@/lib/authentica/client';
import { verifyEmailOtpCode } from '@/lib/otp/hash-email-code';
import {
  assertOtpNotLocked,
  consumeOtp,
  findActiveOtp,
  recordFailedOtpAttempt,
  reserveOtpAttempt,
  type OtpIdentifier,
} from '@/lib/otp/attempt-guard';
import { signTempToken } from '@/lib/auth/temp-token';
import { mintSessionForUser } from '@/lib/auth/mint-session';
import { accountDisabledError } from '@/lib/auth/get-caller-context';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = verifyOtpSchema.parse(await request.json());
  const { channel, code, purpose } = input;

  if (channel === 'email' && purpose === 'register') {
    throw new ApiError(400, 'email_otp_unsupported_purpose', 'التسجيل الجديد يتم برقم الجوال فقط');
  }
  if (purpose === 'change_phone' || purpose === 'change_email') {
    throw new ApiError(400, 'otp_purpose_not_supported', 'هذا الرمز يُستخدم من صفحة الحساب فقط');
  }

  const supabase = createServiceRoleClient();
  const identifier: OtpIdentifier =
    channel === 'sms' ? { column: 'phone', value: input.phone as string } : { column: 'email', value: input.email as string };

  const failedAttempts = await assertOtpNotLocked(supabase, identifier, purpose);
  const row = await findActiveOtp(supabase, identifier, purpose, channel);
  await reserveOtpAttempt(supabase, row);

  // sms is verified remotely by Authentica; email has no such provider —
  // the code is checked locally against the hash stored at send time
  // (migration 0042's header explains why).
  const verified =
    channel === 'sms' ? await verifyOtpSms(identifier.value, code) : verifyEmailOtpCode(code, row.code_hash as string);
  if (!verified) {
    await recordFailedOtpAttempt(supabase, row, failedAttempts);
    throw new ApiError(401, 'otp_incorrect', 'رمز التحقق غير صحيح');
  }

  await consumeOtp(supabase, row);

  // Every downstream step (temp token / session) is keyed by phone, since
  // every account has one regardless of which channel this OTP used —
  // email is only ever a second way to *find* the same account.
  let phone: string;
  if (channel === 'sms') {
    phone = identifier.value;
  } else {
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('phone')
      .eq('email', identifier.value)
      .single();
    if (userByEmailError || !userByEmail) {
      throw new Error(`Failed to resolve user by email during OTP verify: ${userByEmailError?.message}`);
    }
    phone = userByEmail.phone;
  }

  if (purpose === 'register') {
    const registration_token = await signTempToken({ phone, purpose: 'register' });
    return okResponse({ registration_token });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('auth_user_id, status')
    .eq('phone', phone)
    .single();
  if (userError || !user) {
    throw new Error(`Failed to load user after OTP verify: ${userError?.message}`);
  }
  if (user.status === 'disabled') {
    throw accountDisabledError();
  }

  if (purpose === 'reset_password') {
    const reset_token = await signTempToken({ phone, purpose: 'reset_password' });
    return okResponse({ reset_token });
  }

  // A team invite creates the user with status 'invited' and no password;
  // their first successful login (this OTP flow) is the activation event.
  if (user.status === 'invited') {
    const { error: activationError } = await supabase.from('users').update({ status: 'active' }).eq('phone', phone);
    if (activationError) throw new Error(`Failed to activate invited user: ${activationError.message}`);
  }

  const session = await mintSessionForUser(supabase, user.auth_user_id);
  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
});
