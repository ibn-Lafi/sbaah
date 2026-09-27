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
const CLOUDFLARE_TIMEOUT_MS = 15_000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function cloudflareFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${CLOUDFLARE_API_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(CLOUDFLARE_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('CLOUDFLARE_API_TOKEN')}`,
      ...init.headers,
    },
  });
  const json = (await response.json().catch(() => null)) as
    | { success: boolean; result?: T; errors?: { message: string }[] }
    | null;
  if (!json) {
    throw new Error(`Cloudflare API returned a non-JSON response (HTTP ${response.status})`);
  }
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
}

/**
 * Registers a non-wildcard hostname with automatic HTTP certificate
 * validation. Once the customer points its CNAME at our SaaS target,
 * Cloudflare serves the CA challenge from its edge; no TXT records are
 * required from the customer.
 */
export async function createCloudflareCustomHostname(domain: string): Promise<CloudflareCustomHostname> {
  const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
  const result = await cloudflareFetch<{ id: string }>(`/zones/${zoneId}/custom_hostnames`, {
    method: 'POST',
    body: JSON.stringify({ hostname: domain, ssl: { method: 'http', type: 'dv' } }),
  });

  return { cloudflareHostnameId: result.id };
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

export interface CloudflareCustomHostnameDetails {
  active: boolean;
  hostnameStatus: string;
  sslStatus: string;
  sslValidationErrors: string[];
  /**
   * The DNS-01 certificate-validation TXT records (`_acme-challenge.<domain>`)
   * Cloudflare's CA needs before it will actually issue a certificate — a
   * SEPARATE requirement from `ownership_verification`'s TXT record (which
   * only proves domain control, not certificate issuance). Cloudflare
   * normally requests two of these per hostname (one per certificate
   * authority/chain, for broader browser compatibility) and — per
   * Cloudflare's own docs — the array can be empty for a short period right
   * after the hostname is created, filling in once Cloudflare has requested
   * the tokens from the CA. Confirmed against Cloudflare's official API
   * reference (developers.cloudflare.com/api/resources/custom_hostnames),
   * not just the founder's live dashboard screenshot.
   */
  sslValidationRecords: { name: string; value: string }[];
}

interface CloudflareCustomHostnameApiResult {
  status: string;
  ssl: {
    status: string;
    validation_records?: { txt_name?: string; txt_value?: string }[];
    validation_errors?: { message?: string }[];
  };
}

function toCustomHostnameDetails(result: CloudflareCustomHostnameApiResult): CloudflareCustomHostnameDetails {
  return {
    active: result.status === 'active' && result.ssl.status === 'active',
    hostnameStatus: result.status,
    sslStatus: result.ssl.status,
    sslValidationErrors: (result.ssl.validation_errors ?? [])
      .map((error) => error.message)
      .filter((message): message is string => Boolean(message)),
    sslValidationRecords: (result.ssl.validation_records ?? [])
      .filter((record) => record.txt_name && record.txt_value)
      .map((record) => ({ name: record.txt_name as string, value: record.txt_value as string })),
  };
}

/**
 * Ground truth for POST /v1/tenant/domain/verify — asks Cloudflare itself
 * whether it considers this hostname fully connected, instead of us
 * re-deriving the same fact independently via our own DNS lookup (which can
 * diverge from Cloudflare's own edge: different resolver path, propagation
 * timing, or a stale re-check — the exact cause of a real "Cloudflare shows
 * it connected, our dashboard still shows pending" bug). `status: 'active'`
 * means Cloudflare is routing traffic for the hostname; `ssl.status:
 * 'active'` means it has actually issued the certificate.
 */
export async function getCloudflareCustomHostnameDetails(
  cloudflareHostnameId: string,
): Promise<CloudflareCustomHostnameDetails> {
  const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
  const result = await cloudflareFetch<CloudflareCustomHostnameApiResult>(
    `/zones/${zoneId}/custom_hostnames/${cloudflareHostnameId}`,
    { method: 'GET' },
  );

  return toCustomHostnameDetails(result);
}

/**
 * Re-runs Cloudflare's hostname and certificate validation immediately.
 * A read-only GET does not restart validation after Cloudflare's backoff has
 * reached a timed-out, moved, or deleted state; PATCHing the same SSL
 * configuration is Cloudflare's documented refresh operation.
 */
export async function refreshCloudflareCustomHostnameDetails(
  cloudflareHostnameId: string,
): Promise<CloudflareCustomHostnameDetails> {
  const zoneId = requireEnv('CLOUDFLARE_ZONE_ID');
  const result = await cloudflareFetch<CloudflareCustomHostnameApiResult>(
    `/zones/${zoneId}/custom_hostnames/${cloudflareHostnameId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ ssl: { method: 'http', type: 'dv' } }),
    },
  );

  return toCustomHostnameDetails(result);
}
