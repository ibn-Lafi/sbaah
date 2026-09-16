'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CloseIcon, MenuIcon } from './marketing/icons';

function BrandMark({ label }: { label: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static PNG brand asset, no responsive/optimization needs
    <img src="/brand-mark.svg" alt={label} width={54} height={24} className="h-6 w-auto" />
  );
}

/**
 * Header + footer for سبعة's own marketing homepage (`[locale]/layout.tsx`'s
 * marketing branch) — fixed platform brand (`#68458A`), never a tenant's
 * `--tenant-primary`. Login/register CTAs point at `dashboard`, since
 * registration and login are its routes, not public-site's.
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

  const navLinks = [
    { href: '#features', label: t.nav.features },
    { href: '#how-it-works', label: t.nav.howItWorks },
    { href: '#pricing', label: t.nav.pricing },
    { href: '#faq', label: t.nav.faq },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href={homeHref} className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <BrandMark label={t.brand} />
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-text-tertiary sm:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-brand">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 text-sm font-medium sm:flex">
            <Link href={otherLocaleHref} className="text-text-tertiary hover:text-brand">
              {t.nav.languageSwitch}
            </Link>
            {dashboardUrl && (
              <a href={`${dashboardUrl}/login`} className="text-text-tertiary hover:text-brand">
                {t.nav.login}
              </a>
            )}
            {dashboardUrl && (
              <a
                href={`${dashboardUrl}/register`}
                className="rounded-control inline-flex h-10 items-center bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                {t.nav.cta}
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? t.nav.menuClose : t.nav.menuOpen}
            className="text-text-primary flex h-9 w-9 items-center justify-center sm:hidden"
          >
            {mobileMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border-subtle bg-surface-card px-6 py-4 sm:hidden">
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
