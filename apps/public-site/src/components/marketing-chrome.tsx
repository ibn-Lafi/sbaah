import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';

/**
 * Header + footer for سبعة's own marketing homepage (`[locale]/layout.tsx`'s
 * marketing branch) — fixed platform brand (`#68458A`), never a tenant's
 * `--tenant-primary`. Login/register CTAs point at `dashboard`, since
 * registration and login are its routes, not public-site's.
 */
export function MarketingChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = MARKETING_CONTENT[locale];
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  const homeHref = locale === 'ar' ? '/' : '/en';
  const otherLocaleHref = locale === 'ar' ? '/en' : '/';

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/90 px-6 py-4 backdrop-blur">
        <Link href={homeHref} className="flex items-center gap-2 font-bold text-brand">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">٧</span>
          <span className="text-lg">{t.brand}</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <a href="#features" className="hidden hover:text-brand sm:inline">
            {t.nav.features}
          </a>
          <a href="#pricing" className="hidden hover:text-brand sm:inline">
            {t.nav.pricing}
          </a>
          <Link href={otherLocaleHref} className="hover:text-brand">
            {t.nav.languageSwitch}
          </Link>
          {dashboardUrl && (
            <a href={`${dashboardUrl}/login`} className="hover:text-brand">
              {t.nav.login}
            </a>
          )}
          {dashboardUrl && (
            <a href={`${dashboardUrl}/register`} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:opacity-90">
              {t.nav.cta}
            </a>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <footer className="flex flex-col items-center gap-2 border-t border-black/10 px-6 py-8 text-sm text-black/60">
        <span className="flex items-center gap-2 font-semibold text-brand">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">٧</span>
          {t.brand}
        </span>
        <span>{t.footer.rights}</span>
      </footer>
    </>
  );
}
