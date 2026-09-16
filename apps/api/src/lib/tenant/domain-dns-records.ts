import type { CloudflareCustomHostname } from './cloudflare-api-client';

export interface DnsRecord {
  type: 'CNAME' | 'TXT';
  name: string;
  value: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/**
 * Builds the two records the owner must add at their DNS provider — stored
 * as-is in tenants.custom_domain_dns_records. Unlike the previous Railway
 * integration (a unique CNAME target per domain), the CNAME here is the same
 * fixed value for every tenant (Cloudflare routes by matching the incoming
 * Host header against the registered Custom Hostname, not by where the CNAME
 * itself resolves) — only the TXT ownership-verification value differs per
 * domain, from Cloudflare's own createCustomHostname response.
 */
export function dnsRecordsFor(customDomain: string, cloudflareHostname: CloudflareCustomHostname): DnsRecord[] {
  return [
    { type: 'CNAME', name: customDomain, value: requireEnv('CLOUDFLARE_FALLBACK_CNAME_TARGET') },
    { type: 'TXT', name: cloudflareHostname.ownershipVerificationName, value: cloudflareHostname.ownershipVerificationValue },
  ];
}

/**
 * Adds/refreshes the certificate-validation TXT records (see
 * `CloudflareCustomHostnameDetails.sslValidationRecords`'s doc comment) onto
 * an existing record set — these normally aren't known yet at the moment
 * `dnsRecordsFor` first runs (Cloudflare fills them in shortly after
 * creating the hostname), so `verify/route.ts` calls this on every check to
 * pick them up once Cloudflare has them, replacing any earlier (possibly
 * stale or empty) set of validation records rather than duplicating them.
 */
export function withSslValidationRecords(
  baseRecords: DnsRecord[],
  sslValidationRecords: { name: string; value: string }[],
): DnsRecord[] {
  const withoutOldValidationRecords = baseRecords.filter((record) => !record.name.startsWith('_acme-challenge.'));
  return [
    ...withoutOldValidationRecords,
    ...sslValidationRecords.map((record) => ({ type: 'TXT' as const, name: record.name, value: record.value })),
  ];
}
