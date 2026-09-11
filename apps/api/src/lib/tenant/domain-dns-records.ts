import type { RailwayCustomDomain } from './railway-api-client';

export interface DnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
}

/** Builds the two records the owner must add at their DNS provider from Railway's customDomainCreate response — stored as-is in tenants.custom_domain_dns_records. */
export function dnsRecordsFor(customDomain: string, railwayDomain: RailwayCustomDomain): DnsRecord[] {
  return [
    { type: 'CNAME', name: customDomain, value: railwayDomain.cnameTarget },
    { type: 'TXT', name: `_railway-verify.${customDomain}`, value: railwayDomain.verificationTxtValue },
  ];
}
