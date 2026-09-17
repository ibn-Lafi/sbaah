'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CloseIcon, MenuIcon } from './marketing/icons';
import { ThemeToggle } from './theme-toggle';

function BrandMark({
  label,
  invert = false,
  className = 'h-6',
}: {
  label: string;
  invert?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset, no responsive/optimization needs
    <img
      src={invert ? '/brand-mark-white.svg' : '/brand-mark.svg'}
      alt={label}
      width={54}
      height={24}
      className={`${className} w-auto`}
    />
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" />
    </svg>
  );
}

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M16 15l4-3-4-3M20 12H9" />
    </svg>
  );
}

/** px past the top before the full-width header switches to its stronger brand background. */
const SCROLL_THRESHOLD = 24;

/**
 * Header + footer for سبعة's own marketing homepage (`[locale]/layout.tsx`'s
 * marketing branch) — fixed platform brand (`#68458A`), never a tenant's
 * `--tenant-primary`. Login/register CTAs point at `dashboard`, since
 * registration and login are its routes, not public-site's.
 *
 * الهيدر عائم (`fixed`) بعرض الشاشة بالكامل، من دون حاوية خارجية أو زوايا
 * تجعله يبدو كأنه كرت منفصل. يكون شفافًا أعلى الصفحة (فوق فيديو Hero)،
 * ويتحوّل إلى شريط بلون المنصة (`bg-brand`) عند التمرير. البقاء أبيض
 * دائمًا (شعار+نص+أيقونات) بلا
 * تبديل لوني حسب حالة التمرير، لأن الحالتين (شفاف فوق فيديو غامق / كرت
 * بنفسجي صلب) كلتاهما تدعم نصًا أبيض بتباين كافٍ — عكس زر "إنشاء حساب"
 * الذي يبقى كرتًا أبيض بنص بنفسجي ليتمايز عن الكرت نفسه حين يصبح بنفسجيًا.
 * الفاصل (`h-20`) يحجز مساحة الهيدر لأنه خارج تدفّق الصفحة — `hero.tsx`
 * يسحب نفسه للأعلى بهامش سالب مطابق (`-mt-20`) خلفه.
 *
 * على الجوال تُثبت إجراءات الحساب الصغيرة في يسار الشاشة، بينما يبقى شعار
 * سبعة في أقصى اليمين وزر القائمة ملاصقًا له بصرف النظر عن اتجاه اللغة.
 * فتح زر القائمة لا ينشئ قائمة منسدلة؛ بل يكشف زري اللغة والوضع بجواره
 * داخل الشريط نفسه كما في المرجع البصري.
 *
 * قائمة الجوال (`mobileMenuOpen`) والوضع الداكن (`ThemeToggle`) هما سبب
 * كون هذا مكوّن عميل — بقية المحتوى ثابت مترجم بلا جلب بيانات.
 */
export function MarketingChrome({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const t = MARKETING_CONTENT[locale];
  const platformRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
  // Keep the two essential account actions present even if Railway receives a
  // build without NEXT_PUBLIC_DASHBOARD_URL. Production uses the conventional
  // dashboard.<root-domain> host; local development keeps its documented port.
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL ??
    (platformRootDomain ? `https://dashboard.${platformRootDomain}` : 'http://localhost:3002');
  const homeHref = locale === 'ar' ? '/' : '/en';
  const otherLocaleHref = locale === 'ar' ? '/en' : '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: t.nav.features },
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#pricing', label: t.nav.pricing },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b text-white backdrop-blur-md transition-colors duration-300 ${
          scrolled ? 'bg-brand/95 border-white/10 shadow-lg' : 'border-white/10 bg-black/25'
        }`}
      >
        <div className="mx-auto hidden h-20 max-w-6xl items-center justify-between px-6 lg:flex">
          <div className="flex items-center gap-3">
            <Link
              href={homeHref}
              className="flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BrandMark label={t.brand} invert />
            </Link>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium text-white/90">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 text-sm font-medium text-white/90">
            <Link href={otherLocaleHref} className="hover:text-white">
              {t.nav.languageSwitch}
            </Link>
            <ThemeToggle labels={t.nav} className="h-9 w-9" />
            {dashboardUrl && (
              <a href={`${dashboardUrl}/login`} className="hover:text-white">
                {t.nav.login}
              </a>
            )}
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/register`}
                className="rounded-control text-brand inline-flex h-10 items-center bg-white px-5 font-semibold transition-colors hover:bg-white/90"
              >
                {t.nav.cta}
              </a>
            )}
          </div>
        </div>

        <div
          dir="ltr"
          className="flex h-20 w-full items-center justify-between gap-1.5 px-3 lg:hidden"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <a
              href={`${dashboardUrl}/login`}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
              className="text-brand flex h-9 flex-none items-center gap-1 whitespace-nowrap rounded-xl bg-white px-2 text-[10px] font-semibold shadow-sm min-[360px]:px-2.5 min-[360px]:text-[11px]"
            >
              {t.nav.login}
              <LoginIcon className="h-3.5 w-3.5" />
            </a>
            <a
              href={`${dashboardUrl}/register`}
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
              className="bg-brand flex h-9 flex-none items-center whitespace-nowrap rounded-xl px-2 text-[10px] font-semibold text-white shadow-sm ring-1 ring-white/15 min-[360px]:px-2.5 min-[360px]:text-[11px]"
            >
              {t.nav.createSite}
            </a>
          </div>

          <div className="flex flex-none items-center gap-1.5">
            <div
              className={`flex items-center gap-1.5 overflow-hidden transition-all duration-200 ${
                mobileMenuOpen ? 'w-[70px] opacity-100' : 'pointer-events-none w-0 opacity-0'
              }`}
              aria-hidden={!mobileMenuOpen}
            >
              {mobileMenuOpen && (
                <>
                  <Link
                    href={otherLocaleHref}
                    aria-label={t.nav.languageSwitch}
                    title={t.nav.languageSwitch}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                  >
                    <GlobeIcon className="h-4 w-4" />
                  </Link>
                  <ThemeToggle labels={t.nav} className="h-8 w-8 rounded-xl" />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? t.nav.menuClose : t.nav.menuOpen}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
            <Link
              href={homeHref}
              aria-label={t.brand}
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-9 flex-none items-center justify-center px-0.5"
            >
              <BrandMark label={t.brand} invert className="h-5 max-[359px]:h-4" />
            </Link>
          </div>
        </div>
      </header>
      <div className="h-20" />

      <main>{children}</main>

      <footer className="bg-surface-subtle-2 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <BrandMark label={t.brand} />
            <p className="text-text-secondary text-sm">{t.footer.tagline}</p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-text-primary text-sm font-semibold">
                {t.footer.columns.product.title}
              </span>
              <a href="#features" className="text-text-secondary hover:text-brand text-sm">
                {t.footer.columns.product.features}
              </a>
              <a href="#pricing" className="text-text-secondary hover:text-brand text-sm">
                {t.footer.columns.product.pricing}
              </a>
              <a href="#faq" className="text-text-secondary hover:text-brand text-sm">
                {t.footer.columns.product.faq}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-text-primary text-sm font-semibold">
                {t.footer.columns.account.title}
              </span>
              {dashboardUrl && (
                <a
                  href={`${dashboardUrl}/login`}
                  className="text-text-secondary hover:text-brand text-sm"
                >
                  {t.footer.columns.account.login}
                </a>
              )}
              {dashboardUrl && (
                <a
                  href={`${dashboardUrl}/register`}
                  className="text-text-secondary hover:text-brand text-sm"
                >
                  {t.footer.columns.account.register}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="text-text-secondary mx-auto mt-10 max-w-6xl text-sm">{t.footer.rights}</div>
      </footer>
    </>
  );
}
