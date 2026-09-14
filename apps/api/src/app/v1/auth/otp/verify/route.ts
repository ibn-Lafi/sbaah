import type { NextRequest } from 'next/server';
import { createServiceRoleClient, verifyOtpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { verifyOtpSms } from '@/lib/authentica/client';
import { verifyEmailOtpCode } from '@/lib/otp/hash-email-code';
import {
  computeLockedUntil,
  isExpired,
  isLocked,
  shouldLockAfterFailedAttempt,
} from '@/lib/otp/otp-policy';
import { signTempToken } from '@/lib/auth/temp-token';
import { mintSessionForUser } from '@/lib/auth/mint-session';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = verifyOtpSchema.parse(await request.json());
  const { channel, code, purpose } = input;

  if (channel === 'email' && purpose === 'register') {
    throw new ApiError(400, 'email_otp_unsupported_purpose', 'التسجيل الجديد يتم برقم الجوال فقط');
  }

  const supabase = createServiceRoleClient();

  let rowQuery = supabase
    .from('otp_verifications')
    .select('id, attempt_count, locked_until, expires_at, code_hash')
    .eq('purpose', purpose)
    .eq('channel', channel)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);
  rowQuery = channel === 'sms' ? rowQuery.eq('phone', input.phone as string) : rowQuery.eq('email', input.email as string);
  const { data: row, error: rowError } = await rowQuery.maybeSingle();

  if (rowError) {
    throw new Error(`Failed to look up OTP request: ${rowError.message}`);
  }
  if (!row) {
    throw new ApiError(400, 'otp_not_found', 'لا يوجد رمز تحقق فعّال، اطلب رمزًا جديدًا');
  }
  if (isLocked(row.locked_until)) {
    throw new ApiError(429, 'otp_locked', 'محاولات كثيرة خاطئة، حاول لاحقًا');
  }
  if (isExpired(row.expires_at)) {
    throw new ApiError(400, 'otp_expired', 'انتهت صلاحية الرمز، اطلب رمزًا جديدًا');
  }

  // sms is verified remotely by Authentica; email has no such provider —
  // the code is checked locally against the hash stored at send time
  // (migration 0042's header explains why).
  const verified =
    channel === 'sms' ? await verifyOtpSms(input.phone as string, code) : verifyEmailOtpCode(code, row.code_hash as string);

  if (!verified) {
    const willLock = shouldLockAfterFailedAttempt(row.attempt_count);
    await supabase
      .from('otp_verifications')
      .update({
        attempt_count: row.attempt_count + 1,
        locked_until: willLock ? computeLockedUntil() : null,
      })
      .eq('id', row.id);
    throw new ApiError(401, 'otp_incorrect', 'رمز التحقق غير صحيح');
  }

  await supabase.from('otp_verifications').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

  // Every downstream step (temp token / session) is keyed by phone, since
  // every account has one regardless of which channel this OTP used —
  // email is only ever a second way to *find* the same account.
  let phone: string;
  if (channel === 'sms') {
    phone = input.phone as string;
  } else {
    const { data: userByEmail, error: userByEmailError } = await supabase
      .from('users')
      .select('phone')
      .eq('email', input.email as string)
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

  if (purpose === 'reset_password') {
    const reset_token = await signTempToken({ phone, purpose: 'reset_password' });
    return okResponse({ reset_token });
  }

  // purpose === 'login': the account already exists (checked at send time).
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('auth_user_id, status')
    .eq('phone', phone)
    .single();
  if (userError || !user) {
    throw new Error(`Failed to load user for login session minting: ${userError?.message}`);
  }

  // A team invite creates the user with status 'invited' and no password;
  // their first successful login (this OTP flow) is the activation event.
  if (user.status === 'invited') {
    await supabase.from('users').update({ status: 'active' }).eq('phone', phone);
  }

  const session = await mintSessionForUser(supabase, user.auth_user_id);
  return okResponse({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  });
});
