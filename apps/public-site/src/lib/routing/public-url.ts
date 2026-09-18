import { headers } from 'next/headers';
import type { Locale } from '@/lib/i18n/locales';
import { getHost } from '@/lib/tenant/get-host';

/** Removes a leading locale segment so callers can pass either canonical or internal App Router paths. */
export function stripLocalePrefix(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/ar' || normalized === '/en') return '/';
  if (normalized.startsWith('/ar/')) return normalized.slice(3);
  if (normalized.startsWith('/en/')) return normalized.slice(3);
  return normalized;
}

/**
 * Public URL contract:
 * - Arabic is the default locale and has no URL prefix.
 * - English is prefixed with /en.
 * - Tenant identity belongs to the hostname, never the pathname.
 */
export function localizedPath(locale: Locale, pathname: string): string {
  const path = stripLocalePrefix(pathname);
  return locale === 'en' ? `/en${path === '/' ? '' : path}` : path;
}

export async function getPublicOrigin(): Promise<string | null> {
  const host = (await getHost())?.trim();
  if (!host) return null;

  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto === 'http' || forwardedProto === 'https'
    ? forwardedProto
    : host.includes('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https';

  return `${protocol}://${host}`;
}

export async function buildLocalizedAlternates(pathname: string): Promise<{
  canonical?: string;
  languages?: Record<string, string>;
}> {
  const origin = await getPublicOrigin();
  if (!origin) return {};

  const ar = `${origin}${localizedPath('ar', pathname)}`;
  const en = `${origin}${localizedPath('en', pathname)}`;

  return {
    canonical: ar,
    languages: {
      ar,
      en,
      'x-default': ar,
    },
  };
}
