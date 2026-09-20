import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import '../globals.css';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';
import { getTenantSiteResult } from '@/lib/tenant/get-tenant-site';
import { isMarketingHost, getHost } from '@/lib/tenant/get-host';
import { resolveWebsiteFont } from '@/lib/theme/fonts';
import { thmanyahSerifDisplay } from '@/lib/fonts/thmanyah-serif-display';
import { SuspendedPage } from '@/components/suspended-page';
import { MarketingChrome } from '@/components/marketing-chrome';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { getThemeComponents } from '@/components/themes/registry';
import { ThemeProvider } from '@/lib/theme/theme-context';
import { THEME_STORAGE_KEY } from '@/lib/theme/theme';
import { buildLocalizedAlternates, canonicalTenantOrigin, getPublicOrigin } from '@/lib/routing/public-url';
import { safeGoogleAnalyticsId } from '@/lib/security/public-values';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const viewport = { themeColor: '#68458A' };

/** سبعة's own brand font for the marketing homepage — fixed, unlike `resolveWebsiteFont()` which picks per-tenant. */
const marketingFont = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });

/** Runs before hydration so a returning visitor's saved dark-mode choice is already on screen at first paint instead of flashing from light — same script/mechanism as apps/dashboard's root layout.tsx. */
const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/** Reads the Host header once per request (via getTenantSiteResult's cache()) so the browser tab title matches the visited tenant, not a generic "سبعة". */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const pathname = ((await headers()).get('x-pathname') ?? '/').split('?')[0] || '/';
  const requestOrigin = await getPublicOrigin();

  if (await isMarketingHost()) {
    return {
      title: MARKETING_CONTENT[locale].brand,
      alternates: requestOrigin ? await buildLocalizedAlternates(locale, pathname, requestOrigin) : undefined,
    };
  }

  const result = await getTenantSiteResult();
  if (result.status !== 'active') {
    return { title: 'سبعة', robots: { index: false, follow: false } };
  }

  const origin = requestOrigin
    ? canonicalTenantOrigin(requestOrigin, result.site.tenant.custom_domain)
    : undefined;

  return {
    title: locale === 'ar' ? result.site.tenant.name_ar : result.site.tenant.name_en,
    alternates: origin ? await buildLocalizedAlternates(locale, pathname, origin) : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  // سبعة's own marketing homepage (not a tenant site) — the bare
  // platform root domain never goes through tenant resolution or
  // renders tenant chrome at all. See components/marketing-chrome.tsx.
  if (await isMarketingHost()) {
    const marketingAnalyticsId = safeGoogleAnalyticsId(process.env.NEXT_PUBLIC_MARKETING_GA_MEASUREMENT_ID);
    return (
      <html lang={locale} dir={dir}>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className={`${marketingFont.className} ${thmanyahSerifDisplay.variable}`}>
          {marketingAnalyticsId && (
            <>
              <Script src={`https://www.googletagmanager.com/gtag/js?id=${marketingAnalyticsId}`} strategy="afterInteractive" />
              <Script id="sbaah-marketing-google-analytics" strategy="afterInteractive">
                {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(marketingAnalyticsId)});`}
              </Script>
            </>
          )}
          <ThemeProvider>
            <MarketingChrome locale={locale}>{children}</MarketingChrome>
            <ServiceWorkerRegister />
          </ThemeProvider>
        </body>
      </html>
    );
  }

  const dict = getDictionary(locale);

  const result = await getTenantSiteResult();
  if (result.status === 'not_found') {
    notFound();
  }

  // Suspended/cancelled tenant, or one whose free trial ran out
  // (PRODUCT_SPEC section 2, task 36/42; migration 0047) — its own
  // complete, unbranded shell (no tenant colors/font/logo, deliberately:
  // see SuspendedPage), never reaching `children`.
  if (result.status === 'suspended') {
    return (
      <html lang={locale} dir={dir}>
        <body>
          <SuspendedPage reason="suspended" />
        </body>
      </html>
    );
  }

  // migration 0047 — تنطبق البيانات المطلوبة قبل النشر (لا فرق ملحوظ
  // للزائر عن "غير موجود" فعليًا، لكن رسالة مختلفة أدق).
  if (result.status === 'incomplete_profile') {
    return (
      <html lang={locale} dir={dir}>
        <body>
          <SuspendedPage reason="incomplete_profile" />
        </body>
      </html>
    );
  }

  const { site } = result;
  const analyticsId = safeGoogleAnalyticsId(site.google_analytics_measurement_id);
  const font = resolveWebsiteFont(site.website.font_family);
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const { Header, Footer } = getThemeComponents(site.website.theme_key);

  // "This same page, other language" — middleware.ts forwards the
  // locale-stripped path (+ query) as a header since Server Components
  // have no usePathname() equivalent.
  const pathWithoutLocale = (await headers()).get('x-pathname') ?? '/';
  const otherLocaleHref = locale === 'ar' ? `/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}` : pathWithoutLocale;

  // Standard SaaS custom-domain practice (Shopify, Webflow, WordPress.com,
  // etc.): once a custom domain is verified, it becomes the tenant's
  // single canonical URL — a visitor who still arrives via the platform
  // subdomain (an old bookmark, a search-engine result) is sent to the
  // custom domain instead, at this exact same page. Avoids duplicate-
  // content SEO penalties from serving the same site at two URLs, and
  // keeps a paid custom domain from being silently overshadowed by the
  // default subdomain. Only reachable here (never for a suspended/
  // incomplete-profile tenant, whose branches above return before `site`
  // even exists) — acceptable, those visitors see the same generic
  // message on the subdomain either way.
  const currentHost = (await getHost())?.replace(/:\d+$/, '').toLowerCase();
  if (site.tenant.custom_domain && currentHost !== site.tenant.custom_domain.toLowerCase()) {
    const currentFullPath = locale === 'ar' ? pathWithoutLocale : `/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`;
    // Permanent (308) — this is the tenant's canonical URL going forward,
    // not a temporary detour, so search engines update their index too.
    permanentRedirect(`https://${site.tenant.custom_domain}${currentFullPath}`);
  }

  return (
    <html
      lang={locale}
      dir={dir}
      style={
        {
          '--tenant-primary': site.website.primary_color,
          '--tenant-secondary': site.website.secondary_color,
        } as React.CSSProperties
      }
    >
      <body className={font.className}>
        {analyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="sbaah-google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(analyticsId)});`}
            </Script>
          </>
        )}
        <Header locale={locale} dict={dict} website={site.website} tenantName={tenantName} otherLocaleHref={otherLocaleHref} />

        <main>{children}</main>

        <Footer locale={locale} dict={dict} tenant={site.tenant} website={site.website} customPages={site.custom_pages} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
