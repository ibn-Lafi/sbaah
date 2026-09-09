import type {
  ConsoleConfirmTotpInput,
  ConsoleLoginInput,
  ConsoleSetupTotpInput,
  ConsoleVerifyTotpInput,
} from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export interface LoginResponse {
  challenge_token: string;
  totp_enabled: boolean;
}

export function login(input: ConsoleLoginInput) {
  return apiPost<LoginResponse>('/console-auth/login', input);
}

export interface SetupTotpResponse {
  setup_token: string;
  secret: string;
  otpauth_uri: string;
}

export function setupTotp(input: ConsoleSetupTotpInput) {
  return apiPost<SetupTotpResponse>('/console-auth/setup-totp', input);
}

export interface SessionResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function confirmTotp(input: ConsoleConfirmTotpInput) {
  return apiPost<SessionResponse>('/console-auth/confirm-totp', input);
}

export function verifyTotp(input: ConsoleVerifyTotpInput) {
  return apiPost<SessionResponse>('/console-auth/verify-totp', input);
}

export interface MeResponse {
  admin: { id: string; full_name: string; phone: string };
}

export function getMe(accessToken: string) {
  return apiGet<MeResponse>('/console-auth/me', accessToken);
}
