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
