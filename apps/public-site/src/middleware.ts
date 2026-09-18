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
  const { pathname, search } = request.nextUrl;

  const prefixedLocale = LOCALES.find((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
  // The layout's language switcher (task 33/42) needs "this same page,
  // other language" — Server Components have no equivalent of
  // usePathname(), so the locale-stripped path + query is forwarded as a
  // request header here, the one place that already knows it.
  const pathWithoutLocale = prefixedLocale ? pathname.slice(`/${prefixedLocale}`.length) || '/' : pathname;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', `${pathWithoutLocale}${search}`);

  if (prefixedLocale === DEFAULT_LOCALE) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = pathWithoutLocale;
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (prefixedLocale) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  // Skip static assets, images, PWA files (sw.js/manifest.webmanifest/
  // offline.html — كانت تُعاد كتابتها خطأً إلى `/ar/sw.js` وما شابه، وهو
  // مسار غير موجود يُسقط الطلب بخطأ 500 لأن `not-found.tsx` بلا root
  // layout في هذا التطبيق أصلًا؛ اكتُشف هذا أثناء اختبار Playwright
  // لصفحة الهبوط الجديدة، غير مرتبط بها لكنه عطل حقيقي كان يمنع تسجيل
  // الـService Worker وملف الـmanifest فعليًا على كل صفحات public-site)،
  // و Next.js الداخلية — فقط مسارات الصفحات تحتاج مقطع لغة. `mp4` أُضيف
  // لاحقًا لنفس السبب بالضبط، اكتُشف عند إضافة فيديو خلفية Hero
  // (public/marketing/hero-motion.mp4) — بلا هذا الاستثناء كان الطلب
  // يُعاد كتابته إلى `/ar/marketing/hero-motion.mp4` (غير موجود) فيسقط
  // بنفس عطل `not-found.tsx` أعلاه، فيمنع تشغيل الفيديو فعليًا في الإنتاج.
  matcher: ['/((?!_next/|api/|favicon.ico|robots\\.txt$|sitemap\\.xml$|sw\\.js$|manifest\\.webmanifest$|offline\\.html$|.*\\.(?:svg|png|jpg|jpeg|webp|ico|mp4)$).*)'],
};
