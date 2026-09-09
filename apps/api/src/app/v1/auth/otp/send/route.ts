import type { NextRequest } from 'next/server';
import { createServiceRoleClient, requestOtpSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { sendOtpSms } from '@/lib/authentica/client';
import { generateOtpCode } from '@/lib/otp/generate-code';
import { OTP_CONFIG } from '@/lib/otp/otp-config';
import { computeExpiresAt, hasExceededSendLimit } from '@/lib/otp/otp-policy';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { phone, purpose } = requestOtpSchema.parse(await request.json());
  const supabase = createServiceRoleClient();

  // Independent reads — no reason to make the customer wait through them
  // one at a time before the (much slower) Authentica call even starts.
  const windowStart = new Date(Date.now() - OTP_CONFIG.sendWindowMs).toISOString();
  const [{ data: existingUser }, { data: recentSends, error: recentSendsError }] = await Promise.all([
    supabase.from('users').select('id').eq('phone', phone).maybeSingle(),
    supabase.from('otp_verifications').select('id').eq('phone', phone).eq('purpose', purpose).gte('created_at', windowStart),
  ]);

  if (purpose === 'register' && existingUser) {
    throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل');
  }
  if (purpose !== 'register' && !existingUser) {
    throw new ApiError(404, 'phone_not_registered', 'رقم الجوال غير مسجّل');
  }
  if (recentSendsError) {
    throw new Error(`Failed to check OTP send rate limit: ${recentSendsError.message}`);
  }
  if (hasExceededSendLimit(recentSends?.length ?? 0)) {
    throw new ApiError(429, 'otp_rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }

  const code = generateOtpCode();
  // docs/OTP_FLOW.md section 6: a new send invalidates any still-active
  // previous row — independent of the SMS actually going out, so it runs
  // alongside the Authentica call instead of before it. The `expires_at`
  // window (see OTP_CONFIG.ttlMs) only starts once this whole request
  // resolves, so shaving time here directly gives the customer more of
  // their 5 minutes to actually receive and type the code.
  await Promise.all([
    supabase
      .from('otp_verifications')
      .update({ expires_at: new Date().toISOString() })
      .eq('phone', phone)
      .eq('purpose', purpose)
      .is('consumed_at', null),
    sendOtpSms(phone, code),
  ]);

  const { error: insertError } = await supabase.from('otp_verifications').insert({
    phone,
    purpose,
    expires_at: computeExpiresAt(),
  });
  if (insertError) {
    throw new Error(`Failed to record OTP send: ${insertError.message}`);
  }

  return okResponse({ status: 'sent' });
});
