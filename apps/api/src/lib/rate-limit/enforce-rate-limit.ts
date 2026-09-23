import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

export interface RateLimitRule {
  bucket: string;
  windowSeconds: number;
  maxEvents: number;
}

export const RATE_LIMITS = {
  otpSendPerIp: { bucket: 'otp_send_ip', windowSeconds: 15 * 60, maxEvents: 10 },
  otpVerifyPerIp: { bucket: 'otp_verify_ip', windowSeconds: 10 * 60, maxEvents: 30 },
  passwordLoginPerIp: { bucket: 'password_login_ip', windowSeconds: 10 * 60, maxEvents: 20 },
  consoleLoginPerIp: { bucket: 'console_login_ip', windowSeconds: 15 * 60, maxEvents: 20 },
  publicLeadPerIp: { bucket: 'public_lead_ip', windowSeconds: 10 * 60, maxEvents: 5 },
  whatsappClickPerIp: { bucket: 'whatsapp_click_ip', windowSeconds: 10 * 60, maxEvents: 20 },
  supportTicketPerIp: { bucket: 'support_ticket_ip', windowSeconds: 60 * 60, maxEvents: 5 },
  supportLookupPerIp: { bucket: 'support_lookup_ip', windowSeconds: 10 * 60, maxEvents: 20 },
} as const satisfies Record<string, RateLimitRule>;

// PostgREST "function not found" / Postgres "undefined function".
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883']);

/**
 * Records one event for `subject` (usually the client IP) and throws a 429
 * once the rule's budget for the window is spent. `supabase` must be a
 * service-role client. Until migration 0110 exists the limit is skipped
 * with a loud log rather than taking every public form offline.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  rule: RateLimitRule,
  subject: string | null,
): Promise<void> {
  const { data: allowed, error } = await supabase.rpc('consume_rate_limit', {
    p_bucket: rule.bucket,
    p_subject: subject ?? 'unknown',
    p_window_seconds: rule.windowSeconds,
    p_max_events: rule.maxEvents,
  });
  if (error) {
    if (error.code && MISSING_FUNCTION_CODES.has(error.code)) {
      console.error(`Rate limit ${rule.bucket} skipped: consume_rate_limit() is missing, apply migration 0110`);
      return;
    }
    throw new Error(`Failed to check rate limit ${rule.bucket}: ${error.message}`);
  }
  if (allowed === false) {
    throw new ApiError(429, 'rate_limited', 'عدد كبير من الطلبات، حاول لاحقًا');
  }
}
