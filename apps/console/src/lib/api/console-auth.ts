import type { ConsoleLoginInput } from '@sbaah/shared';
import { apiGet, apiPost } from './client';

export interface SessionResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function login(input: ConsoleLoginInput) {
  return apiPost<SessionResponse>('/console-auth/login', input);
}

export interface MeResponse {
  admin: { id: string; full_name: string; phone: string };
}

export function getMe(accessToken: string) {
  return apiGet<MeResponse>('/console-auth/me', accessToken);
}
