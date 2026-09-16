import { cache } from 'react';
import { headers } from 'next/headers';

/**
 * The one place that reads the incoming tenant hostname — `getTenantSite()`
 * and every data-fetching function below `/properties` share this so the
 * header is read once per request (React `cache()`) and every call site
 * agrees on the exact same `domain` value forwarded to `api`.
 *
 * Reads `X-Tenant-Host` before falling back to the raw `Host` header — a
 * real production bug found live: Railway's own edge validates the `Host`
 * header independently of TLS/SNI routing, and rejects any hostname not
 * explicitly registered for the service (404, `x-railway-fallback: true`).
 * A tenant custom domain (e.g. `www.manshoori.com`) is only ever known to
 * Cloudflare's Custom Hostname layer, never to Railway — so a Cloudflare
 * Origin Rule must rewrite the `Host` sent to Railway's origin to our own
 * registered `.up.railway.app` domain before Railway will accept the
 * request at all (see the founder-facing setup notes for this rule). Once
 * that rewrite happens, the ORIGINAL hostname is gone from `Host` — a
 * Cloudflare Transform Rule (configured to run first) captures it into
 * `X-Tenant-Host` instead, which is what this function actually needs.
 * Deliberately not `X-Forwarded-Host` — Railway is documented to rewrite
 * that header itself, which would erase it before it reaches this app.
 * Falls back to `Host` for anything not yet going through that Cloudflare
 * setup (local dev, or platform subdomains, whose real `Host` already
 * satisfies Railway's check without any rewrite).
 */
export const getHost = cache(async (): Promise<string | null> => {
  const requestHeaders = await headers();
  return requestHeaders.get('x-tenant-host') ?? requestHeaders.get('host');
});

/**
 * True only for the bare platform root domain itself (e.g. `sbaah.com`,
 * not `ahmed.sbaah.com`) — سبعة's own marketing homepage, never a
 * tenant. `[locale]/layout.tsx` and `[locale]/page.tsx` both check this
 * before doing any tenant resolution at all.
 */
export async function isMarketingHost(): Promise<boolean> {
  const rootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN?.toLowerCase();
  if (!rootDomain) return false;
  const host = (await getHost())?.replace(/:\d+$/, '').toLowerCase();
  return host === rootDomain;
}
