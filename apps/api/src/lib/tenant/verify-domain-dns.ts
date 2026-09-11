import { promises as dns } from 'node:dns';
import { requireCnameTarget } from './dns-record';

function normalize(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '');
}

/**
 * Real DNS check for POST /v1/tenant/domain/verify — self-service
 * verification (founder's explicit decision: no manual console review,
 * automatic like any SaaS custom-domain flow). Resolves the tenant's
 * `custom_domain` CNAME and compares it to `PUBLIC_SITE_CNAME_TARGET`.
 * Every failure mode (domain not found, no CNAME record yet, DNS
 * timeout, wrong target) is a plain `false` — this is polled by the
 * owner clicking "اختبار الربط" after DNS propagation, not an error
 * condition to surface as a 500.
 */
export async function verifyDomainDns(customDomain: string): Promise<boolean> {
  const target = normalize(requireCnameTarget());
  try {
    const records = await dns.resolveCname(customDomain);
    return records.some((record) => normalize(record) === target);
  } catch {
    return false;
  }
}
