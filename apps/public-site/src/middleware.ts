import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n/locales';

/**
 * PRODUCT_SPEC.md section 3: public-site is bilingual (AR/EN) with
 * distinct crawlable URLs per language (section 7's SSR/SEO goal) —
 * Arabic is unprefixed (default), English lives under `/en/...`. Both
 * are internally rewritten onto the same `app/[locale]/...` route tree,
 * so every page/layout gets its locale from `params.locale` with no
 * further routing logic duplicated per page.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const prefixedLocale = LOCALES.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  if (prefixedLocale) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip static assets, images, and Next.js internals — only page routes
  // need a locale segment.
  matcher: ['/((?!_next/|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
