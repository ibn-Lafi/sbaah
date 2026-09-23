import type { NextRequest } from 'next/server';
import { createServiceRoleClient, verifyProfileChangeSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
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

/**
 * Applies a verified phone or email change to the caller's own account.
 * The OTP was sent to the *new* identifier, so a correct code proves the
 * caller controls it. Phone is also the Supabase Auth password-login
 * identifier, so both records change together.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase: userClient } = getAuthenticatedClient(request);
  const caller = await getCallerContext(userClient);
  const input = verifyProfileChangeSchema.parse(await request.json());

  const service = createServiceRoleClient();
  const purpose = input.channel === 'sms' ? 'change_phone' : 'change_email';
  const identifier: OtpIdentifier =
    input.channel === 'sms' ? { column: 'phone', value: input.phone } : { column: 'email', value: input.email };

  const failedAttempts = await assertOtpNotLocked(service, identifier, purpose);
  const row = await findActiveOtp(service, identifier, purpose, input.channel);
  await reserveOtpAttempt(service, row);

  const verified =
    input.channel === 'sms'
      ? await verifyOtpSms(input.phone, input.code)
      : verifyEmailOtpCode(input.code, row.code_hash as string);
  if (!verified) {
    await recordFailedOtpAttempt(service, row, failedAttempts);
    throw new ApiError(401, 'otp_incorrect', 'رمز التحقق غير صحيح');
  }

  const { data: takenBy, error: takenError } = await service
    .from('users')
    .select('id')
    .eq(identifier.column, identifier.value)
    .neq('id', caller.userId)
    .maybeSingle();
  if (takenError) throw new Error(`Failed to check identifier ownership: ${takenError.message}`);
  if (takenBy) {
    throw input.channel === 'sms'
      ? new ApiError(409, 'phone_already_registered', 'رقم الجوال مستخدم لحساب آخر')
      : new ApiError(409, 'email_already_used', 'البريد الإلكتروني مستخدم لحساب آخر');
  }

  await consumeOtp(service, row);

  if (input.channel === 'email') {
    const { error } = await service.from('users').update({ email: input.email }).eq('id', caller.userId);
    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'email_already_used', 'البريد الإلكتروني مستخدم لحساب آخر');
      throw new Error(`Failed to update profile email: ${error.message}`);
    }
    return okResponse({ status: 'updated' });
  }

  const { data: currentUser, error: currentUserError } = await service
    .from('users')
    .select('phone')
    .eq('id', caller.userId)
    .single();
  if (currentUserError || !currentUser) throw new Error(`Failed to load current phone: ${currentUserError?.message}`);

  const { error: authUpdateError } = await service.auth.admin.updateUserById(caller.authUserId, {
    phone: input.phone,
    phone_confirm: true,
  });
  if (authUpdateError) throw new Error(`Failed to update auth phone: ${authUpdateError.message}`);

  const { error: updateError } = await service.from('users').update({ phone: input.phone }).eq('id', caller.userId);
  if (updateError) {
    const { error: rollbackError } = await service.auth.admin.updateUserById(caller.authUserId, {
      phone: currentUser.phone,
      phone_confirm: true,
    });
    if (updateError.code === '23505' && !rollbackError) {
      throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مستخدم لحساب آخر');
    }
    throw new Error(
      `Failed to update profile phone: ${updateError.message}${rollbackError ? `; auth rollback also failed: ${rollbackError.message}` : ''}`,
    );
  }

  return okResponse({ status: 'updated' });
});
