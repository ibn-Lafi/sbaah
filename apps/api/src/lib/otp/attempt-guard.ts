import type { SupabaseClient } from '@supabase/supabase-js';
import type { OtpPurpose } from '@sbaah/shared';
import { ApiError } from '@/lib/http';
import { OTP_CONFIG } from './otp-config';
import { computeLockedUntil, hasExhaustedVerifyAttempts, isExpired, isLocked, sumFailedAttempts } from './otp-policy';

export type OtpIdentifier = { column: 'phone'; value: string } | { column: 'email'; value: string };

export interface ActiveOtpRow {
  id: string;
  attempt_count: number;
  expires_at: string;
  code_hash: string | null;
}

function otpLockedError(): ApiError {
  return new ApiError(429, 'otp_locked', 'محاولات كثيرة خاطئة، حاول لاحقًا');
}

/**
 * The verify budget belongs to the identifier+purpose, not to one OTP row:
 * requesting a new code must never hand an attacker a fresh set of guesses.
 * Attempts still count on rows a resend already expired; a successful
 * (consumed) verification resets the budget.
 */
export async function assertOtpNotLocked(
  supabase: SupabaseClient,
  identifier: OtpIdentifier,
  purpose: OtpPurpose,
): Promise<number> {
  const windowStart = new Date(Date.now() - OTP_CONFIG.lockoutDurationMs).toISOString();
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('attempt_count, locked_until')
    .eq(identifier.column, identifier.value)
    .eq('purpose', purpose)
    .is('consumed_at', null)
    .gte('created_at', windowStart);
  if (error) throw new Error(`Failed to check OTP lockout: ${error.message}`);

  const rows = data ?? [];
  const failedAttempts = sumFailedAttempts(rows);
  if (rows.some((row) => isLocked(row.locked_until)) || hasExhaustedVerifyAttempts(failedAttempts)) {
    throw otpLockedError();
  }
  return failedAttempts;
}

export async function findActiveOtp(
  supabase: SupabaseClient,
  identifier: OtpIdentifier,
  purpose: OtpPurpose,
  channel: 'sms' | 'email',
): Promise<ActiveOtpRow> {
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('id, attempt_count, expires_at, code_hash')
    .eq(identifier.column, identifier.value)
    .eq('purpose', purpose)
    .eq('channel', channel)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Failed to look up OTP request: ${error.message}`);
  if (!data) throw new ApiError(400, 'otp_not_found', 'لا يوجد رمز تحقق فعّال، اطلب رمزًا جديدًا');
  if (isExpired(data.expires_at)) {
    throw new ApiError(400, 'otp_expired', 'انتهت صلاحية الرمز، اطلب رمزًا جديدًا');
  }
  return data;
}

/**
 * Spends one attempt *before* the code is checked, with a compare-and-set
 * on attempt_count. Concurrent guesses against the same row cannot all read
 * the same count and slip past the limit: only one request wins each count.
 */
export async function reserveOtpAttempt(supabase: SupabaseClient, row: ActiveOtpRow): Promise<void> {
  const { data, error } = await supabase
    .from('otp_verifications')
    .update({ attempt_count: row.attempt_count + 1 })
    .eq('id', row.id)
    .eq('attempt_count', row.attempt_count)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Failed to record OTP attempt: ${error.message}`);
  if (!data) throw new ApiError(409, 'otp_attempt_in_progress', 'تتم معالجة محاولة أخرى لهذا الرمز، حاول مرة أخرى');
}

export async function recordFailedOtpAttempt(
  supabase: SupabaseClient,
  row: ActiveOtpRow,
  failedAttemptsBefore: number,
): Promise<void> {
  if (hasExhaustedVerifyAttempts(failedAttemptsBefore + 1)) {
    const { error } = await supabase
      .from('otp_verifications')
      .update({ locked_until: computeLockedUntil() })
      .eq('id', row.id);
    if (error) throw new Error(`Failed to lock OTP after failed attempts: ${error.message}`);
  }
}

/** Only one request can consume a verified code, so it cannot mint two sessions or tokens. */
export async function consumeOtp(supabase: SupabaseClient, row: ActiveOtpRow): Promise<void> {
  const { data, error } = await supabase
    .from('otp_verifications')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(`Failed to consume OTP: ${error.message}`);
  if (!data) throw new ApiError(400, 'otp_not_found', 'لا يوجد رمز تحقق فعّال، اطلب رمزًا جديدًا');
}
