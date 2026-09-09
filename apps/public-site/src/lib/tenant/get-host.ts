import { cache } from 'react';
import { headers } from 'next/headers';

/**
 * The one place that reads the incoming `Host` header — `getTenantSite()`
 * and every data-fetching function below `/properties` share this so the
 * header is read once per request (React `cache()`) and every call site
 * agrees on the exact same `domain` value forwarded to `api`.
 */
export const getHost = cache(async (): Promise<string | null> => {
  return (await headers()).get('host');
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
