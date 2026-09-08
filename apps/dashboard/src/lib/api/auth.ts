import type { AccountType, OtpPurpose, RegisterInput, ResetPasswordInput, TenantStatus, UserRole, UserStatus } from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export function sendOtp(phone: string, purpose: OtpPurpose) {
  return apiPost<{ status: 'sent' }>('/auth/otp/send', { phone, purpose });
}

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
  return apiPost<RegisterOtpVerified>('/auth/otp/verify', { phone, code, purpose: 'register' });
}

export function verifyResetPasswordOtp(phone: string, code: string) {
  return apiPost<ResetPasswordOtpVerified>('/auth/otp/verify', { phone, code, purpose: 'reset_password' });
}

export function verifyLoginOtp(phone: string, code: string) {
  return apiPost<LoginOtpVerified>('/auth/otp/verify', { phone, code, purpose: 'login' });
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  tenant_id: string;
  subdomain: string;
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
    status: TenantStatus;
  };
}

export function getMe(accessToken: string) {
  return apiGet<MeResponse>('/auth/me', accessToken);
}
