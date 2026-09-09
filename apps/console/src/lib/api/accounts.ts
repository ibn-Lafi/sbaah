import type { ConsoleAccountUpdateInput, CustomDomainStatus, Tenant, TenantStatus } from '@sbaah/shared';
import { apiGet, apiPatch } from './client';

export interface AccountListResponse {
  accounts: Tenant[];
  page: number;
  page_size: number;
  total: number;
}

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export function listAccounts(
  accessToken: string,
  params: { status?: TenantStatus; custom_domain_status?: CustomDomainStatus; page?: number; page_size?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.custom_domain_status) query.set('custom_domain_status', params.custom_domain_status);
  if (params.page) query.set('page', String(params.page));
  if (params.page_size) query.set('page_size', String(params.page_size));
  const qs = query.toString();
  return apiGet<AccountListResponse>(`/console/accounts${qs ? `?${qs}` : ''}`, accessToken);
}

export function getAccount(accessToken: string, id: string) {
  return apiGet<{ account: Tenant; dns_record: DnsRecord | null }>(`/console/accounts/${id}`, accessToken);
}

export function updateAccount(accessToken: string, id: string, input: ConsoleAccountUpdateInput) {
  return apiPatch<{ account: Tenant }>(`/console/accounts/${id}`, input, accessToken);
}
