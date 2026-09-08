import type { NextRequest } from 'next/server';
import { createServiceRoleClient, verifyOtpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { checkVerification } from '@/lib/twilio/verify-client';
import {
  computeLockedUntil,
  isExpired,
  isLocked,
  shouldLockAfterFailedAttempt,
} from '@/lib/otp/otp-policy';
import { signTempToken } from '@/lib/auth/temp-token';
import { mintSessionForUser } from '@/lib/auth/mint-session';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { phone, code, purpose } = verifyOtpSchema.parse(await request.json());
  const supabase = createServiceRoleClient();

  const { data: row, error: rowError } = await supabase
    .from('otp_verifications')
    .select('id, attempt_count, locked_until, expires_at')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rowError) {
    throw new Error(`Failed to look up OTP request: ${rowError.message}`);
  }
  if (!row) {
    throw new ApiError(400, 'otp_not_found', 'لا يوجد رمز تحقق فعّال لهذا الرقم، اطلب رمزًا جديدًا');
  }
  if (isLocked(row.locked_until)) {
    throw new ApiError(429, 'otp_locked', 'محاولات كثيرة خاطئة، حاول لاحقًا');
  }
  if (isExpired(row.expires_at)) {
    throw new ApiError(400, 'otp_expired', 'انتهت صلاحية الرمز، اطلب رمزًا جديدًا');
  }

  const check = await checkVerification(phone, code);

  if (check.status !== 'approved') {
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
