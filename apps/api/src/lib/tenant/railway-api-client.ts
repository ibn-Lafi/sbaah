/**
 * Thin wrapper over Railway's own public GraphQL API — the actual
 * mechanism behind real, automatically-issued Let's Encrypt certificates
 * for tenant custom domains. `docs.railway.com` is blocked by this
 * environment's network egress policy (same gap flagged in
 * streampay-client.ts when that gateway was integrated), so the mutation
 * and field shapes below come from public search-result summaries of
 * Railway's docs and community threads, not a verified fetch. Confirm
 * against a real domain before fully trusting this in production — a
 * wrong field name surfaces as a Railway API error, thrown as-is below.
 *
 * Why this exists at all: a customer's domain CNAMEd at a static Railway
 * hostname is NOT enough on its own. Railway's edge only terminates TLS
 * (and only requests a certificate) for a domain it has been explicitly
 * told belongs to a service — via the dashboard, or this API. That's why
 * `tenants.custom_domain_dns_records` stores records returned per-domain
 * from this call, instead of computing one shared CNAME target for every
 * tenant (the previous, incorrect approach).
 */

const RAILWAY_API_URL = 'https://backboard.railway.com/graphql/v2';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

interface RailwayDnsRecord {
  hostlabel: string;
  requiredValue: string;
}

async function railwayGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const response = await fetch(RAILWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('RAILWAY_API_TOKEN')}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Railway API error: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) {
    throw new Error('Railway API returned no data');
  }
  return json.data;
}

export interface RailwayCustomDomain {
  railwayDomainId: string;
  cnameTarget: string;
  verificationTxtValue: string;
}

/**
 * Registers `domain` against the public-site Railway service so Railway
 * starts issuing it a certificate once DNS is pointed correctly — called
 * once, when the owner first sets their custom domain. Requires
 * RAILWAY_API_TOKEN (an account/workspace-scoped API token created in
 * Railway's dashboard), RAILWAY_PROJECT_ID, RAILWAY_ENVIRONMENT_ID, and
 * RAILWAY_PUBLIC_SITE_SERVICE_ID — all visible in the Railway dashboard
 * for the public-site service (project settings / the service's own
 * URL contains project and environment ids; the service id is in its
 * settings page).
 */
export async function createRailwayCustomDomain(domain: string): Promise<RailwayCustomDomain> {
  const data = await railwayGraphQL<{
    customDomainCreate: { id: string; status: { dnsRecords: RailwayDnsRecord[]; verificationToken: string } };
  }>(
    `mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        status { dnsRecords { hostlabel requiredValue } verificationToken }
      }
    }`,
    {
      input: {
        projectId: requireEnv('RAILWAY_PROJECT_ID'),
        environmentId: requireEnv('RAILWAY_ENVIRONMENT_ID'),
        serviceId: requireEnv('RAILWAY_PUBLIC_SITE_SERVICE_ID'),
        domain,
      },
    },
  );

  const cnameRecord = data.customDomainCreate.status.dnsRecords[0];
  if (!cnameRecord) {
    throw new Error('Railway API did not return a CNAME record for the new custom domain');
  }

  return {
    railwayDomainId: data.customDomainCreate.id,
    cnameTarget: cnameRecord.requiredValue,
    verificationTxtValue: data.customDomainCreate.status.verificationToken,
  };
}

/**
 * Cleans up Railway's side when an owner unlinks their custom domain —
 * otherwise stale, never-verified domain entries pile up in the Railway
 * project. Best-effort: swallows errors so removing the domain from our
 * own database is never blocked by Railway's API being unreachable or
 * the domain already having been removed on Railway's side.
 */
export async function deleteRailwayCustomDomain(railwayDomainId: string): Promise<void> {
  try {
    await railwayGraphQL(`mutation customDomainDelete($id: String!) { customDomainDelete(id: $id) }`, {
      id: railwayDomainId,
    });
  } catch {
    // best-effort cleanup only — see doc comment above.
  }
}
