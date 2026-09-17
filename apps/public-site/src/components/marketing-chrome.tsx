'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CloseIcon } from './marketing/icons';
import { ThemeToggle } from './theme-toggle';

function BrandMark({ label, invert = false, className = 'h-6' }: { label: string; invert?: boolean; className?: string }) {
  return <img src={invert ? '/brand-mark-white.svg' : '/brand-mark.svg'} alt={label} width={54} height={24} className={`${className} w-auto`} />;
}

function GlobeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" /></svg>;
}

function QuickControlsIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M10 14v6" /></svg>;
}

const SCROLL_THRESHOLD = 24;

export function MarketingChrome({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = MARKETING_CONTENT[locale];
  const platformRootDomain = process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN;
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? (platformRootDomain ? `https://dashboard.${platformRootDomain}` : 'http://localhost:3002');
  const homeHref = locale === 'ar' ? '/' : '/en';
  const otherLocaleHref = locale === 'ar' ? '/en' : '/';
  const [quickControlsOpen, setQuickControlsOpen] = useState(false);
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
      <header className={`fixed inset-x-0 top-0 z-50 text-white transition-all duration-300 ${scrolled ? 'border-b border-white/10 bg-brand/95 shadow-lg backdrop-blur-md' : 'border-b border-transparent bg-transparent shadow-none backdrop-blur-none'}`}>
        <div className="mx-auto hidden h-16 max-w-6xl items-center justify-between px-6 lg:flex">
          <Link href={homeHref} className="flex items-center"><BrandMark label={t.brand} invert className="h-5" /></Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-white/90">
            {navLinks.map((link) => <a key={link.href} href={link.href} className="hover:text-white">{link.label}</a>)}
          </nav>
          <div className="flex items-center gap-2.5 text-sm font-medium">
            <Link href={otherLocaleHref} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/90 hover:bg-white/10 hover:text-white" aria-label={t.nav.languageSwitch}><GlobeIcon className="h-4 w-4" /></Link>
            <ThemeToggle labels={t.nav} className="h-9 w-9 rounded-xl" />
            <a href={`${dashboardUrl}/login`} className="inline-flex h-9 items-center rounded-xl border border-white/30 px-4 text-white transition-colors hover:bg-white/10">{t.nav.login}</a>
            <a href={`${dashboardUrl}/register`} className="text-brand inline-flex h-9 items-center rounded-xl bg-white px-4 font-semibold transition-colors hover:bg-white/90">{t.nav.cta}</a>
          </div>
        </div>

        <div dir="ltr" className="flex h-16 w-full items-center justify-between px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <a href={`${dashboardUrl}/register`} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="text-brand flex h-7 flex-none items-center whitespace-nowrap rounded-[9px] bg-white px-3 text-xs font-semibold leading-none shadow-sm transition-colors hover:bg-white/90">{t.nav.cta}</a>
            <a href={`${dashboardUrl}/login`} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="flex h-7 flex-none items-center whitespace-nowrap rounded-[9px] border border-white/35 px-3 text-xs font-semibold leading-none text-white transition-colors hover:bg-white/10">{t.nav.login}</a>
          </div>
          <Link href={homeHref} aria-label={t.brand} className="flex h-9 flex-none items-center justify-center"><BrandMark label={t.brand} invert className="h-5 max-[359px]:h-[18px]" /></Link>
        </div>
      </header>
      <div className="h-16" />
      <main>{children}</main>

      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[60] flex flex-col items-center gap-2 lg:hidden">
        <div className={`flex flex-col items-center gap-2 transition-all duration-200 ${quickControlsOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`} aria-hidden={!quickControlsOpen}>
          <Link href={otherLocaleHref} aria-label={t.nav.languageSwitch} title={t.nav.languageSwitch} className="text-brand flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white shadow-lg transition-transform hover:scale-105"><GlobeIcon className="h-5 w-5" /></Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-800 shadow-lg"><ThemeToggle labels={t.nav} className="h-11 w-11 rounded-full bg-transparent text-current hover:bg-black/5" /></div>
        </div>
        <button type="button" onClick={() => setQuickControlsOpen((value) => !value)} aria-label={quickControlsOpen ? t.nav.menuClose : t.nav.menuOpen} aria-expanded={quickControlsOpen} className="bg-brand flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl ring-1 ring-white/20 transition-transform active:scale-95">
          {quickControlsOpen ? <CloseIcon className="h-5 w-5" /> : <QuickControlsIcon className="h-5 w-5" />}
        </button>
      </div>

      <footer className="bg-surface-subtle-2 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="flex max-w-xs flex-col gap-3"><BrandMark label={t.brand} /><p className="text-text-secondary text-sm">{t.footer.tagline}</p></div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-3"><span className="text-text-primary text-sm font-semibold">{t.footer.columns.product.title}</span><a href="#features" className="text-text-secondary hover:text-brand text-sm">{t.footer.columns.product.features}</a><a href="#pricing" className="text-text-secondary hover:text-brand text-sm">{t.footer.columns.product.pricing}</a><a href="#faq" className="text-text-secondary hover:text-brand text-sm">{t.footer.columns.product.faq}</a></div>
            <div className="flex flex-col gap-3"><span className="text-text-primary text-sm font-semibold">{t.footer.columns.account.title}</span><a href={`${dashboardUrl}/login`} className="text-text-secondary hover:text-brand text-sm">{t.footer.columns.account.login}</a><a href={`${dashboardUrl}/register`} className="text-text-secondary hover:text-brand text-sm">{t.footer.columns.account.register}</a></div>
          </div>
        </div>
        <div className="text-text-secondary mx-auto mt-10 max-w-6xl text-sm">{t.footer.rights}</div>
      </footer>
    </>
  );
}
