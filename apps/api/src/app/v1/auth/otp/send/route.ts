import type { NextRequest } from 'next/server';
import { createServiceRoleClient, requestOtpSchema, REGISTRATION_OPEN, type OtpPurpose } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { sendOtpSms } from '@/lib/authentica/client';
import { sendEmail } from '@/lib/email/send';
import { otpCodeEmail } from '@/lib/email/templates';
import { generateOtpCode } from '@/lib/otp/generate-code';
import { hashEmailOtpCode } from '@/lib/otp/hash-email-code';
import { OTP_CONFIG } from '@/lib/otp/otp-config';
import { computeExpiresAt, hasExceededSendLimit } from '@/lib/otp/otp-policy';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = requestOtpSchema.parse(await request.json());
  const { channel, purpose } = input;

  // Registration stays phone-only (docs/OTP_FLOW.md, migration 0042's
  // header) — there is no email-based account creation.
  if (channel === 'email' && (purpose === 'register' || purpose === 'change_phone')) {
    throw new ApiError(400, 'email_otp_unsupported_purpose', 'هذا الإجراء يتطلب التحقق عبر رقم الجوال');
  }
  if (purpose === 'register' && !REGISTRATION_OPEN) {
    throw new ApiError(503, 'registration_closed', 'التسجيل الجديد متوقف مؤقتًا، سيعاد فتحه قريبًا');
  }

  const supabase = createServiceRoleClient();
  const windowStart = new Date(Date.now() - OTP_CONFIG.sendWindowMs).toISOString();

  if (channel === 'sms') {
    const phone = input.phone as string;

    // Independent reads — no reason to make the customer wait through them
    // one at a time before the (much slower) Authentica call even starts.
    const [{ data: existingUser }, { data: recentSends, error: recentSendsError }] = await Promise.all([
      supabase.from('users').select('id').eq('phone', phone).maybeSingle(),
      supabase
        .from('otp_verifications')
        .select('id')
        .eq('phone', phone)
        .eq('purpose', purpose)
        .gte('created_at', windowStart),
    ]);

    if (purpose === 'change_phone' && existingUser) {
      throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مستخدم لحساب آخر');
    }
    if (purpose === 'register' && existingUser) {
      throw new ApiError(409, 'phone_already_registered', 'رقم الجوال مسجّل بالفعل');
    }
    if (!['register', 'change_phone'].includes(purpose) && !existingUser) {
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
      channel: 'sms',
      phone,
      purpose,
      expires_at: computeExpiresAt(),
    });
    if (insertError) {
      throw new Error(`Failed to record OTP send: ${insertError.message}`);
    }

    return okResponse({ status: 'sent' });
  }

  // channel === 'email' — no external verifier (migration 0042's header):
  // we generate the code, hash it for storage, and check it ourselves in
  // otp/verify. `purpose` is 'login' | 'reset_password' here, the
  // 'register' case having already been rejected above.
  const email = input.email as string;
  const emailPurpose = purpose as Exclude<OtpPurpose, 'register' | 'change_phone'>;

  const [{ data: existingUser }, { data: recentSends, error: recentSendsError }] = await Promise.all([
    supabase.from('users').select('id').eq('email', email).maybeSingle(),
    supabase
      .from('otp_verifications')
      .select('id')
      .eq('email', email)
      .eq('purpose', purpose)
      .gte('created_at', windowStart),
  ]);

  if (purpose === 'change_email' && existingUser) {
    throw new ApiError(409, 'email_already_used', 'البريد الإلكتروني مستخدم لحساب آخر');
  }
  if (purpose !== 'change_email' && !existingUser) {
    throw new ApiError(404, 'email_not_registered', 'البريد الإلكتروني غير مسجّل');
  }
  if (recentSendsError) {
    throw new Error(`Failed to check OTP send rate limit: ${recentSendsError.message}`);
  }
  if (hasExceededSendLimit(recentSends?.length ?? 0)) {
    throw new ApiError(429, 'otp_rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }

  const code = generateOtpCode();
  const codeHash = hashEmailOtpCode(code);

  await Promise.all([
    supabase
      .from('otp_verifications')
      .update({ expires_at: new Date().toISOString() })
      .eq('email', email)
      .eq('purpose', purpose)
      .is('consumed_at', null),
    sendEmail({ to: email, ...otpCodeEmail({ code, purpose: emailPurpose }) }),
  ]);

  const { error: insertError } = await supabase.from('otp_verifications').insert({
    channel: 'email',
    email,
    purpose,
    expires_at: computeExpiresAt(),
    code_hash: codeHash,
  });
  if (insertError) {
    throw new Error(`Failed to record OTP send: ${insertError.message}`);
  }

  return okResponse({ status: 'sent' });
});
