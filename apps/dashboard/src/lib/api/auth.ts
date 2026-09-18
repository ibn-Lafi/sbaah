import type {
  AccountType,
  CustomDomainStatus,
  OtpPurpose,
  RegisterInput,
  ResetPasswordInput,
  TenantStatus,
  UserRole,
  UserStatus,
} from '@sbaah/shared';
import { apiGet, apiPatch, apiPost } from './client';

export function sendOtp(phone: string, purpose: OtpPurpose) {
  return apiPost<{ status: 'sent' }>('/auth/otp/send', { channel: 'sms', phone, purpose });
}

/** Email-OTP only supports 'login'/'reset_password' — never 'register' (phone stays the sole registration identifier). */
export function sendOtpByEmail(email: string, purpose: Extract<OtpPurpose, 'login' | 'reset_password'>) {
  return apiPost<{ status: 'sent' }>('/auth/otp/send', { channel: 'email', email, purpose });
}

/** Either identifies the request by phone (sms channel) or email (email channel) — never both. */
export type OtpIdentifier = { phone: string } | { email: string };

/** docs/OTP_FLOW.md section 5: verify's response shape depends on `purpose` — callers narrow by the field they expect. */
export interface RegisterOtpVerified {
  registration_token: string;
}
export interface ResetPasswordOtpVerified {
  reset_token: string;
}
export interface LoginOtpVerified {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function verifyRegisterOtp(phone: string, code: string) {
  return apiPost<RegisterOtpVerified>('/auth/otp/verify', { channel: 'sms', phone, code, purpose: 'register' });
}

function otpChannelFields(identifier: OtpIdentifier) {
  return 'phone' in identifier
    ? { channel: 'sms' as const, phone: identifier.phone }
    : { channel: 'email' as const, email: identifier.email };
}

export function verifyResetPasswordOtp(identifier: OtpIdentifier, code: string) {
  return apiPost<ResetPasswordOtpVerified>('/auth/otp/verify', {
    ...otpChannelFields(identifier),
    code,
    purpose: 'reset_password',
  });
}

export function verifyLoginOtp(identifier: OtpIdentifier, code: string) {
  return apiPost<LoginOtpVerified>('/auth/otp/verify', { ...otpChannelFields(identifier), code, purpose: 'login' });
}

/** Phone+password logs in directly against Supabase instead (see login/page.tsx) — this is the email-only counterpart, mediated by `api` since Supabase Auth has no real notion of the user's own email. */
export function loginWithPasswordByEmail(email: string, password: string) {
  return apiPost<LoginOtpVerified>('/auth/login', { channel: 'email', email, password });
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenant_id: string;
  subdomain: string;
  /** True only when the chosen plan was the one free-trial plan (migration 0047) — the register page skips StreamPay checkout entirely in that case. */
  is_trial: boolean;
}

export function register(payload: RegisterInput) {
  return apiPost<RegisterResponse>('/auth/register', payload);
}

export function resetPassword(payload: ResetPasswordInput) {
  return apiPost<{ status: 'ok' }>('/auth/reset-password', payload);
}

export interface MeResponse {
  user: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    role: UserRole;
    status: UserStatus;
  };
  tenant: {
    id: string;
    name_ar: string;
    name_en: string;
    account_type: AccountType;
    subdomain: string;
    custom_domain: string | null;
    custom_domain_status: CustomDomainStatus | null;
    status: TenantStatus;
    /** Set only for a trial-plan signup (migration 0047) — past this, the account is read-only until the tenant subscribes to a real plan. */
    trial_ends_at: string | null;
    cr_number: string | null;
    tax_number: string | null;
    fal_license_number: string | null;
    social_instagram: string | null;
    social_tiktok: string | null;
    social_whatsapp: string | null;
    social_snapchat: string | null;
    social_phone: string | null;
    social_facebook: string | null;
    social_x: string | null;
    social_telegram: string | null;
  };
}

export function getMe(accessToken: string) {
  return apiGet<MeResponse>('/auth/me', accessToken);
}

export function updateMyEmail(accessToken: string, email: string | null) {
  return apiPatch<{ user: MeResponse['user'] }>('/auth/me', { email }, accessToken);
}
