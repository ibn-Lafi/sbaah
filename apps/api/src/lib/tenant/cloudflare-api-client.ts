/**
 * Thin wrapper over Cloudflare's Custom Hostnames API (Cloudflare for SaaS) —
 * confirmed directly against a live test hostname created in the founder's
 * own Cloudflare dashboard (not just docs/search-result guesses, unlike the
 * earlier StreamPay/Railway integrations): `ssl.method: 'txt'` returns a
 * per-domain ownership-verification TXT record shaped exactly like
 * `{ name: '_cf-custom-hostname.<domain>', value: '<uuid>' }` under
 * `ownership_verification` in the create response.
 *
 * Why this replaces `railway-api-client.ts`'s custom-domain registration:
 * Railway's "custom domains per service" limit (Hobby: 2, Pro: 20) is
 * incompatible with a multi-tenant SaaS where every tenant wants their own
 * domain on the SAME public-site service — Railway's own support confirms
 * they do not raise this further for multi-tenant use cases at that scale.
 * Cloudflare for SaaS instead terminates TLS/routing at Cloudflare's edge for
 * an effectively unlimited number of tenant hostnames (100 free, then
 * pay-as-you-go), all forwarded to ONE shared "Fallback Origin"
 * (`fallback.<PLATFORM_ROOT_DOMAIN>`, a proxied CNAME onto the public-site
 * Railway service, configured once in the Cloudflare dashboard — not
 * per-tenant, not something this client manages). Railway itself therefore
 * only ever sees that one fallback hostname, never each tenant's real domain.
 *
 * Routing vs. ownership are two separate concerns here: every tenant CNAMEs
 * their domain at the SAME fixed `CLOUDFLARE_FALLBACK_CNAME_TARGET` (unlike
 * Railway, which needed a unique per-domain target) — that CNAME is what
 * actually routes their traffic onto Cloudflare's network. The TXT record
 * this client returns is only Cloudflare's proof that this account controls
 * the domain, required before it will issue a certificate for it.
 */

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function cloudflareFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${CLOUDFLARE_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('CLOUDFLARE_API_TOKEN')}`,
      ...init.headers,
    },
  });
  const json = (await response.json()) as { success: boolean; result?: T; errors?: { message: string }[] };
  if (!json.success) {
    throw new Error(`Cloudflare API error: ${json.errors?.map((e) => e.message).join('; ') ?? 'unknown error'}`);
  }
  if (json.result === undefined) {
    throw new Error('Cloudflare API returned no result');
  }
  return json.result;
}

export interface CloudflareCustomHostname {
  cloudflareHostnameId: string;
  ownershipVerificationName: string;
  ownershipVerificationValue: string;
}

/**
 * Registers `domain` as a Custom Hostname on our zone so Cloudflare starts
 * issuing it a certificate once the owner adds both DNS records — called
 * once, when the owner first sets their custom domain. Requires
 * CLOUDFLARE_API_TOKEN (a Zone-scoped token with SSL and Certificates: Edit)
 * and CLOUDFLARE_ZONE_ID (PLATFORM_ROOT_DOMAIN's own zone id, both from
 * Cloudflare's dashboard).
 */
export async function createCloudflareCustomHostname(domain: string): Promise<CloudflareCustomHostname> {
  const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
  const result = await cloudflareFetch<{
    id: string;
    ownership_verification: { name: string; value: string };
  }>(`/zones/${zoneId}/custom_hostnames`, {
    method: 'POST',
    body: JSON.stringify({ hostname: domain, ssl: { method: 'txt', type: 'dv' } }),
  });

  return {
    cloudflareHostnameId: result.id,
    ownershipVerificationName: result.ownership_verification.name,
    ownershipVerificationValue: result.ownership_verification.value,
  };
}

/**
 * Cleans up Cloudflare's side when an owner unlinks their custom domain —
 * otherwise stale, never-verified hostnames pile up on the zone. Best-effort:
 * swallows errors so removing the domain from our own database is never
 * blocked by Cloudflare's API being unreachable or the hostname already
 * having been removed on Cloudflare's side.
 */
export async function deleteCloudflareCustomHostname(cloudflareHostnameId: string): Promise<void> {
  try {
    const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
    await cloudflareFetch(`/zones/${zoneId}/custom_hostnames/${cloudflareHostnameId}`, { method: 'DELETE' });
  } catch {
    // best-effort cleanup only — see doc comment above.
  }
}
