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
 * Automatic HTTP validation needs only the routing CNAME. Cloudflare serves
 * the certificate authority's challenge from its own edge after this record
 * points at the SaaS target, so customers never copy rotating TXT tokens.
 */
export function dnsRecordsFor(customDomain: string): DnsRecord[] {
  return [
    { type: 'CNAME', name: customDomain, value: requireEnv('CLOUDFLARE_FALLBACK_CNAME_TARGET') },
  ];
}
