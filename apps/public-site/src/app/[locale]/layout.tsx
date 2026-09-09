import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import '../globals.css';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { resolveWebsiteFont } from '@/lib/theme/fonts';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/** Reads the Host header once per request (via getTenantSite's cache()) so the browser tab title matches the visited tenant, not a generic "سبعة". */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const site = await getTenantSite();
  if (!site) {
    return { title: 'سبعة' };
  }
  return { title: locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }
  const locale: Locale = rawLocale;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dict = getDictionary(locale);

  const site = await getTenantSite();
  if (!site) {
    notFound();
  }

  const font = resolveWebsiteFont(site.website.font_family);
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const otherLocaleHref = locale === 'ar' ? '/en' : '/';

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
          <Link href="/" className="flex items-center gap-2 font-semibold text-tenant-primary">
            {site.website.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.website.logo_url} alt={tenantName} className="h-9 w-auto" />
            ) : (
              <span className="text-lg">{tenantName}</span>
            )}
          </Link>
          <Link href={otherLocaleHref} className="text-sm text-tenant-primary hover:underline">
            {dict.languageSwitch}
          </Link>
        </header>

        <main>{children}</main>

        <footer className="border-t border-black/10 px-6 py-6 text-sm text-black/60">{tenantName}</footer>
      </body>
    </html>
  );
}
