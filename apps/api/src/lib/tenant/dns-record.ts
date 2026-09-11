/** PRODUCT_SPEC section 4.3: the CNAME target is a deployment-time value (task 42/42's Railway guide), never hardcoded. Also read by verify-domain-dns.ts so the record shown to the owner and the record actually checked can never drift apart. */
export function requireCnameTarget(): string {
  const target = process.env.PUBLIC_SITE_CNAME_TARGET;
  if (!target) {
    throw new Error('Missing required environment variable: PUBLIC_SITE_CNAME_TARGET');
  }
  return target;
}

export function dnsRecordFor(customDomain: string) {
  return { type: 'CNAME', name: customDomain, value: requireCnameTarget() };
}
