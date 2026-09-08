import type { CustomDomainStatus } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch } from './client';

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

export interface DomainInfo {
  custom_domain: string | null;
  custom_domain_status: CustomDomainStatus | null;
  dns_record: DnsRecord | null;
}

export function getDomain(accessToken: string) {
  return apiGet<DomainInfo>('/tenant/domain', accessToken);
}

export function setDomain(accessToken: string, custom_domain: string) {
  return apiPatch<DomainInfo>('/tenant/domain', { custom_domain }, accessToken);
}

export function removeDomain(accessToken: string) {
  return apiDelete<{ status: string }>('/tenant/domain', accessToken);
}
