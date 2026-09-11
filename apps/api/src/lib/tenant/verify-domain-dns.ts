import { promises as dns } from 'node:dns';
import type { DnsRecord } from './domain-dns-records';

function normalize(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '');
}

async function cnameMatches(hostname: string, expectedValue: string): Promise<boolean> {
  const target = normalize(expectedValue);
  try {
    const records = await dns.resolveCname(hostname);
    return records.some((record) => normalize(record) === target);
  } catch {
    return false;
  }
}

async function txtMatches(hostname: string, expectedValue: string): Promise<boolean> {
  try {
    const chunkedRecords = await dns.resolveTxt(hostname);
    // Node returns each TXT record as an array of string chunks that
    // together form the value — join before comparing.
    return chunkedRecords.some((chunks) => chunks.join('') === expectedValue);
  } catch {
    return false;
  }
}

/**
 * Real DNS check for POST /v1/tenant/domain/verify — self-service
 * verification (founder's explicit decision: no manual console review,
 * automatic like any SaaS custom-domain flow). Checks BOTH records
 * Railway itself requires before it will issue a certificate: the CNAME
 * (routing) and the TXT ownership-verification record
 * (`_railway-verify.<domain>`) — matching what `createRailwayCustomDomain`
 * stored in `tenants.custom_domain_dns_records`. Every failure mode
 * (domain not found, record not published yet, DNS timeout, wrong value)
 * is a plain `false` — this is polled by the owner clicking "اختبار
 * الربط" after DNS propagation, not an error condition to surface as a
 * 500.
 */
export async function verifyDomainDns(records: DnsRecord[]): Promise<boolean> {
  const results = await Promise.all(
    records.map((record) =>
      record.type === 'TXT' ? txtMatches(record.name, record.value) : cnameMatches(record.name, record.value),
    ),
  );
  return results.every(Boolean);
}
