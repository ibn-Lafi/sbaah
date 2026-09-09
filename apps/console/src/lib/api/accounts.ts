import type { ConsoleAccountUpdateInput, Tenant, TenantStatus } from '@sbaah/shared';
import { apiGet, apiPatch } from './client';

export interface AccountListResponse {
  accounts: Tenant[];
  page: number;
  page_size: number;
  total: number;
}

export function listAccounts(accessToken: string, params: { status?: TenantStatus; page?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiGet<AccountListResponse>(`/console/accounts${qs ? `?${qs}` : ''}`, accessToken);
}

export function getAccount(accessToken: string, id: string) {
  return apiGet<{ account: Tenant }>(`/console/accounts/${id}`, accessToken);
}

export function updateAccount(accessToken: string, id: string, input: ConsoleAccountUpdateInput) {
  return apiPatch<{ account: Tenant }>(`/console/accounts/${id}`, input, accessToken);
}
