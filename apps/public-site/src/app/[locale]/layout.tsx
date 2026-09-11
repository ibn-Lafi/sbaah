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
import { BUSINESS_BADGE_COLOR, CallIcon, CrIcon, FalIcon, InstagramIcon, LocationIcon, SnapchatIcon, TaxIcon, TiktokIcon, WhatsappIcon } from '@/components/footer-icons';

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

  // "تواصل معنا" (الاتصال/واتساب) rendered as their own labeled rows in
  // the footer's middle column, not lumped into this row — this list is
  // purely the social-media accounts (right column, plain icon row).
  const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '');
  const socialLinks = [
    site.tenant.social_instagram && { key: 'instagram', href: site.tenant.social_instagram, Icon: InstagramIcon },
    site.tenant.social_tiktok && { key: 'tiktok', href: site.tenant.social_tiktok, Icon: TiktokIcon },
    site.tenant.social_snapchat && { key: 'snapchat', href: site.tenant.social_snapchat, Icon: SnapchatIcon },
  ].filter((entry): entry is { key: string; href: string; Icon: typeof InstagramIcon } => Boolean(entry));

  const businessNumbers = [
    site.tenant.cr_number && { key: 'cr' as const, label: dict.crNumber, Icon: CrIcon },
    site.tenant.tax_number && { key: 'tax' as const, label: dict.taxNumber, Icon: TaxIcon },
    site.tenant.fal_license_number && { key: 'fal' as const, label: dict.falLicense, Icon: FalIcon },
  ].filter((entry): entry is { key: 'cr' | 'tax' | 'fal'; label: string; Icon: typeof CrIcon } => Boolean(entry));

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

        <footer className="flex flex-col gap-8 bg-[#13151f] px-6 py-10 text-sm text-white/60">
          <div className="flex flex-wrap items-start justify-between gap-10">
            {/* الشعار — جميع الحقوق محفوظة @سبعة — حسابات التواصل الاجتماعي */}
            <div className="flex min-w-[220px] max-w-[280px] flex-col items-start gap-4">
              {site.website.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.website.logo_url} alt={tenantName} style={{ maxWidth: 200, maxHeight: 80 }} className="w-auto" />
              ) : (
                <span className="text-lg font-semibold text-white">{tenantName}</span>
              )}
              <SiteBadge accountType={site.tenant.account_type} locale={locale} />
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4">
                  {socialLinks.map(({ key, href, Icon }) => (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-tenant-primary">
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* تواصل معنا — الاتصال، واتساب، العنوان */}
            <div className="flex min-w-[220px] flex-col items-start gap-4">
              <h3 className="text-base font-semibold text-white">{dict.contact}</h3>
              {site.tenant.social_phone && (
                <a href={`tel:${digitsOnly(site.tenant.social_phone)}`} className="flex items-center gap-3 hover:text-tenant-primary">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                    <CallIcon className="h-[16px] w-[16px]" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-white/40">{dict.phoneNumber}</span>
                    <span className="font-medium text-white" dir="ltr">
                      {site.tenant.social_phone}
                    </span>
                  </span>
                </a>
              )}
              {site.tenant.social_whatsapp && (
                <a
                  href={`https://wa.me/${digitsOnly(site.tenant.social_whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-tenant-primary"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                    <WhatsappIcon className="h-[16px] w-[16px]" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-xs text-white/40">{dict.whatsappNumber}</span>
                    <span className="font-medium text-white" dir="ltr">
                      {site.tenant.social_whatsapp}
                    </span>
                  </span>
                </a>
              )}
              {site.website.footer_description && (
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-tenant-primary">
                    <LocationIcon className="h-[16px] w-[16px]" />
                  </span>
                  <p className="pt-1.5 text-white/70">{site.website.footer_description}</p>
                </div>
              )}
            </div>

            {/* أخرى — روابط الصفحات */}
            {site.custom_pages.length > 0 && (
              <div className="flex min-w-[160px] flex-col items-start gap-3">
                <h3 className="text-base font-semibold text-white">{dict.otherPages}</h3>
                {site.custom_pages.map((page) => (
                  <Link
                    key={page.id}
                    href={locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`}
                    className="text-white/60 hover:text-tenant-primary"
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {businessNumbers.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              {businessNumbers.map(({ key, label, Icon }) => (
                <span
                  key={key}
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                  style={{ color: BUSINESS_BADGE_COLOR[key] }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              ))}
            </div>
          )}
        </footer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
