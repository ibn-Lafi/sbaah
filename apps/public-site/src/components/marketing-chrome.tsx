'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CloseIcon, MenuIcon } from './marketing/icons';

function BrandMark({ label, invert = false }: { label: string; invert?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG brand asset, no responsive/optimization needs
    <img src={invert ? '/brand-mark-white.svg' : '/brand-mark.svg'} alt={label} width={54} height={24} className="h-6 w-auto" />
  );
}

/** px past the top before the header switches from fully transparent to its solid brand-color card — same pattern/threshold as themes/classic/header.tsx. */
const SCROLL_THRESHOLD = 24;

/**
 * Header + footer for سبعة's own marketing homepage (`[locale]/layout.tsx`'s
 * marketing branch) — fixed platform brand (`#68458A`), never a tenant's
 * `--tenant-primary`. Login/register CTAs point at `dashboard`, since
 * registration and login are its routes, not public-site's.
 *
 * الهيدر عائم (`fixed`) بنفس أسلوب `themes/classic/header.tsx` تمامًا:
 * شفاف بالكامل أعلى الصفحة (فوق فيديو Hero)، يتحوّل لكرت بلون المنصة
 * (`bg-brand`) عند التمرير. البقاء أبيض دائمًا (شعار+نص+أيقونات) بلا
 * تبديل لوني حسب حالة التمرير، لأن الحالتين (شفاف فوق فيديو غامق / كرت
 * بنفسجي صلب) كلتاهما تدعم نصًا أبيض بتباين كافٍ — عكس زر "إنشاء حساب"
 * الذي يبقى كرتًا أبيض بنص بنفسجي ليتمايز عن الكرت نفسه حين يصبح بنفسجيًا.
 * الفاصل (`h-20`) يحجز مساحة الهيدر لأنه خارج تدفّق الصفحة — `hero.tsx`
 * يسحب نفسه للأعلى بهامش سالب مطابق (`-mt-20`) خلفه.
 *
 * قائمة الجوال (`mobileMenuOpen`) هي السبب الوحيد لكون هذا مكوّن عميل —
 * بقية المحتوى ثابت مترجم بلا جلب بيانات.
 */
export function MarketingChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = MARKETING_CONTENT[locale];
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;
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
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
        <div
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl px-6 text-white transition-colors duration-300 ${
            scrolled ? 'bg-brand/95 shadow-lg backdrop-blur' : 'bg-transparent'
          }`}
        >
          <Link href={homeHref} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <BrandMark label={t.brand} invert />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/90 sm:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 text-sm font-medium text-white/90 sm:flex">
            <Link href={otherLocaleHref} className="hover:text-white">
              {t.nav.languageSwitch}
            </Link>
            {dashboardUrl && (
              <a href={`${dashboardUrl}/login`} className="hover:text-white">
                {t.nav.login}
              </a>
            )}
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/register`}
                className="rounded-control inline-flex h-10 items-center bg-white px-5 font-semibold text-brand transition-colors hover:bg-white/90"
              >
                {t.nav.cta}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? t.nav.menuClose : t.nav.menuOpen}
            className="flex h-9 w-9 items-center justify-center text-white sm:hidden"
          >
            {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-2xl bg-surface-card px-6 py-4 shadow-lg sm:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-text-tertiary">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-brand">
                  {link.label}
                </a>
              ))}
              <Link href={otherLocaleHref} className="py-1 hover:text-brand">
                {t.nav.languageSwitch}
              </Link>
              {dashboardUrl && (
                <a href={`${dashboardUrl}/login`} className="py-1 hover:text-brand">
                  {t.nav.login}
                </a>
              )}
            </nav>
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/register`}
                className="rounded-control mt-4 flex h-11 items-center justify-center bg-brand font-semibold text-white"
              >
                {t.nav.cta}
              </a>
            )}
          </div>
        )}
      </header>
      <div className="h-20" />

      <main>{children}</main>

      <footer className="border-t border-border-subtle bg-surface-subtle-2 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex max-w-xs flex-col gap-3">
            <BrandMark label={t.brand} />
            <p className="text-sm text-text-secondary">{t.footer.tagline}</p>
          </div>

          <div className="flex gap-12">
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-text-primary">{t.footer.columns.product.title}</span>
              <a href="#features" className="text-sm text-text-secondary hover:text-brand">
                {t.footer.columns.product.features}
              </a>
              <a href="#pricing" className="text-sm text-text-secondary hover:text-brand">
                {t.footer.columns.product.pricing}
              </a>
              <a href="#faq" className="text-sm text-text-secondary hover:text-brand">
                {t.footer.columns.product.faq}
              </a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-text-primary">{t.footer.columns.account.title}</span>
              {dashboardUrl && (
                <a href={`${dashboardUrl}/login`} className="text-sm text-text-secondary hover:text-brand">
                  {t.footer.columns.account.login}
                </a>
              )}
              {dashboardUrl && (
                <a href={`${dashboardUrl}/register`} className="text-sm text-text-secondary hover:text-brand">
                  {t.footer.columns.account.register}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-border-subtle pt-6 text-sm text-text-secondary">
          {t.footer.rights}
        </div>
      </footer>
    </>
  );
}
