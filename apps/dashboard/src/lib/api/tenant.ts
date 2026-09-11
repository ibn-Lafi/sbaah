import type { CustomDomainStatus, SocialLinksUpdateInput } from '@sbaah/shared';
import { apiGet, apiDelete, apiPatch, apiPost } from './client';

export interface SocialLinks {
  social_instagram: string | null;
  social_tiktok: string | null;
  social_whatsapp: string | null;
  social_snapchat: string | null;
  social_phone: string | null;
}

export function updateSocialLinks(accessToken: string, input: SocialLinksUpdateInput) {
  return apiPatch<SocialLinks>('/tenant/social-links', input, accessToken);
}

export interface DnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
}

export interface DomainInfo {
  custom_domain: string | null;
  custom_domain_status: CustomDomainStatus | null;
  /** One CNAME (routing) + one TXT (Railway ownership verification) record — both required before Railway issues a certificate. */
  dns_records: DnsRecord[];
  custom_domain_allowed: boolean;
}

export function getDomain(accessToken: string) {
  return apiGet<DomainInfo>('/tenant/domain', accessToken);
}

/** Self-service DNS check ("اختبار الربط") — a real CNAME + TXT lookup, no admin review involved. */
export function verifyDomain(accessToken: string) {
  return apiPost<{ custom_domain_status: CustomDomainStatus; verified: boolean }>('/tenant/domain/verify', undefined, accessToken);
}

export function setDomain(accessToken: string, custom_domain: string) {
  return apiPatch<DomainInfo>('/tenant/domain', { custom_domain }, accessToken);
}

export function removeDomain(accessToken: string) {
  return apiDelete<{ status: string }>('/tenant/domain', accessToken);
}

export function updateSubdomain(accessToken: string, subdomain: string) {
  return apiPatch<{ subdomain: string }>('/tenant/subdomain', { subdomain }, accessToken);
}
