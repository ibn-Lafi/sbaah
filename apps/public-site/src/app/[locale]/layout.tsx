import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import '../globals.css';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/lib/i18n/locales';
import { getDictionary } from '@/lib/i18n/dictionary';
import { getTenantSiteResult } from '@/lib/tenant/get-tenant-site';
import { isMarketingHost } from '@/lib/tenant/get-host';
import { resolveWebsiteFont } from '@/lib/theme/fonts';
import { SiteBadge } from '@/components/site-badge';
import { SuspendedPage } from '@/components/suspended-page';
import { MarketingChrome } from '@/components/marketing-chrome';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { CallIcon, CrIcon, FalIcon, InstagramIcon, SnapchatIcon, TaxIcon, TiktokIcon, WhatsappIcon } from '@/components/footer-icons';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const viewport = { themeColor: '#68458A' };

/** سبعة's own brand font for the marketing homepage — fixed, unlike `resolveWebsiteFont()` which picks per-tenant. */
const marketingFont = IBM_Plex_Sans_Arabic({ subsets: ['arabic'], weight: ['400', '500', '600', '700'] });

/** Reads the Host header once per request (via getTenantSiteResult's cache()) so the browser tab title matches the visited tenant, not a generic "سبعة". */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  if (await isMarketingHost()) {
    return { title: MARKETING_CONTENT[locale].brand };
  }
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

  // سبعة's own marketing homepage (not a tenant site) — the bare
  // platform root domain never goes through tenant resolution or
  // renders tenant chrome at all. See components/marketing-chrome.tsx.
  if (await isMarketingHost()) {
    return (
      <html lang={locale} dir={dir}>
        <body className={marketingFont.className}>
          <MarketingChrome locale={locale}>{children}</MarketingChrome>
          <ServiceWorkerRegister />
        </body>
      </html>
    );
  }

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

  const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');
  const socialLinks = [
    site.tenant.social_instagram && { key: 'instagram', href: site.tenant.social_instagram, Icon: InstagramIcon },
    site.tenant.social_tiktok && { key: 'tiktok', href: site.tenant.social_tiktok, Icon: TiktokIcon },
    site.tenant.social_whatsapp && { key: 'whatsapp', href: `https://wa.me/${digitsOnly(site.tenant.social_whatsapp)}`, Icon: WhatsappIcon },
    site.tenant.social_snapchat && { key: 'snapchat', href: site.tenant.social_snapchat, Icon: SnapchatIcon },
    site.tenant.social_phone && { key: 'phone', href: `tel:${digitsOnly(site.tenant.social_phone)}`, Icon: CallIcon },
  ].filter((entry): entry is { key: string; href: string; Icon: typeof InstagramIcon } => Boolean(entry));

  const businessNumbers = [
    site.tenant.cr_number && { key: 'cr', label: dict.crNumber, value: site.tenant.cr_number, Icon: CrIcon },
    site.tenant.tax_number && { key: 'tax', label: dict.taxNumber, value: site.tenant.tax_number, Icon: TaxIcon },
    site.tenant.fal_license_number && { key: 'fal', label: dict.falLicense, value: site.tenant.fal_license_number, Icon: FalIcon },
  ].filter((entry): entry is { key: string; label: string; value: string; Icon: typeof CrIcon } => Boolean(entry));

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
        {site.website.announcement_bar_text && (
          <div className="bg-tenant-primary px-6 py-2 text-center text-sm font-medium text-white">
            {site.website.announcement_bar_text}
          </div>
        )}
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
            <Link href={locale === 'ar' ? '/projects' : '/en/projects'} className="text-sm hover:text-tenant-primary">
              {dict.projects}
            </Link>
            <Link href={locale === 'ar' ? '/about' : '/en/about'} className="text-sm hover:text-tenant-primary">
              {dict.about}
            </Link>
            <Link href={locale === 'ar' ? '/contact' : '/en/contact'} className="text-sm hover:text-tenant-primary">
              {dict.contact}
            </Link>
            <Link href={otherLocaleHref} className="text-sm text-tenant-primary hover:underline">
              {dict.languageSwitch}
            </Link>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="flex flex-col gap-6 border-t border-black/10 px-6 py-8 text-sm text-black/70">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <div className="flex max-w-[280px] flex-col gap-3">
              {site.website.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.website.logo_url} alt={tenantName} style={{ maxWidth: 250, maxHeight: 100 }} className="w-auto" />
              ) : (
                <span className="text-base font-semibold text-black/80">{tenantName}</span>
              )}
              {site.website.footer_description && <p className="text-black/60">{site.website.footer_description}</p>}
            </div>

            {socialLinks.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {socialLinks.map(({ key, href, Icon }) => (
                  <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-tenant-primary">
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}

            {site.custom_pages.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-black/40">{dict.otherPages}</span>
                {site.custom_pages.map((page) => (
                  <Link
                    key={page.id}
                    href={locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`}
                    className="hover:text-tenant-primary"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {businessNumbers.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-black/10 pt-4 text-xs text-black/50" dir="ltr">
              {businessNumbers.map(({ key, label, value, Icon }) => (
                <span key={key} className="flex items-center gap-1.5">
                  <Icon className="h-[15px] w-[15px]" />
                  {label}: {value}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 border-t border-black/10 pt-6">
            <span>{tenantName}</span>
            <SiteBadge accountType={site.tenant.account_type} locale={locale} />
          </div>
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
