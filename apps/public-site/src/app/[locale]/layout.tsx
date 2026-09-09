import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import '../globals.css';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';
import { getTenantSiteResult } from '@/lib/tenant/get-tenant-site';
import { resolveWebsiteFont } from '@/lib/theme/fonts';
import { SiteBadge } from '@/components/site-badge';
import { SuspendedPage } from '@/components/suspended-page';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Reads the Host header once per request (via getTenantSiteResult's cache()) so the browser tab title matches the visited tenant, not a generic "سبعة". */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const result = await getTenantSiteResult();
  if (result.status !== 'active') {
    return { title: 'سبعة' };
  }
  return { title: locale === 'ar' ? result.site.tenant.name_ar : result.site.tenant.name_en };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dict = getDictionary(locale);

  const result = await getTenantSiteResult();
  if (result.status === 'not_found') {
    notFound();
  }

  // Suspended/cancelled tenant (PRODUCT_SPEC section 2, task 36/42) —
  // its own complete, unbranded shell (no tenant colors/font/logo,
  // deliberately: see SuspendedPage), never reaching `children`.
  if (result.status === 'suspended') {
    return (
      <html lang={locale} dir={dir}>
        <body>
          <SuspendedPage />
        </body>
      </html>
    );
  }

  const { site } = result;
  const font = resolveWebsiteFont(site.website.font_family);
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;

  // "This same page, other language" — middleware.ts forwards the
  // locale-stripped path (+ query) as a header since Server Components
  // have no usePathname() equivalent.
  const pathWithoutLocale = (await headers()).get('x-pathname') ?? '/';
  const otherLocaleHref = locale === 'ar' ? `/en${pathWithoutLocale === '/' ? '' : pathWithoutLocale}` : pathWithoutLocale;

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
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <Link href={locale === 'ar' ? '/' : '/en'} className="flex items-center gap-2 font-semibold text-tenant-primary">
            {site.website.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.website.logo_url} alt={tenantName} className="h-9 w-auto" />
            ) : (
              <span className="text-lg">{tenantName}</span>
            )}
          </Link>
          <nav className="flex items-center gap-5">
            <Link href={locale === 'ar' ? '/properties' : '/en/properties'} className="text-sm hover:text-tenant-primary">
              {dict.properties}
            </Link>
            <Link href={otherLocaleHref} className="text-sm text-tenant-primary hover:underline">
              {dict.languageSwitch}
            </Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="flex flex-col items-center gap-3 border-t border-black/10 px-6 py-6 text-sm text-black/60">
          <span>{tenantName}</span>
          <SiteBadge accountType={site.tenant.account_type} locale={locale} />
        </footer>
      </body>
    </html>
  );
}
