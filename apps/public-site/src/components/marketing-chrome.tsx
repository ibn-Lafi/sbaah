'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CloseIcon } from './marketing/icons';
import { ThemeToggle } from './theme-toggle';
import { apiGet } from '@/lib/api/client';

function BrandMark({ label, invert = false, className = 'h-6' }: { label: string; invert?: boolean; className?: string }) {
  return <img src={invert ? '/brand-mark-white.svg' : '/brand-mark.svg'} alt={label} width={54} height={24} className={`${className} w-auto`} />;
}

function GlobeIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9s1.3-6.5 3.8-9z" /></svg>;
}

function QuickControlsIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><path d="M10.4 10.4 7.8 7.8M13.6 10.4l2.6-2.6M10.4 13.6l-2.6 2.6M13.6 13.6l2.6 2.6"/></svg>;
}

interface PublicPlatformSettings {
  social_tiktok: string | null;
  social_instagram: string | null;
  social_x: string | null;
}

function SocialIcon({ type }: { type: 'tiktok' | 'instagram' | 'x' }) {
  if (type === 'instagram') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg>;
  if (type === 'x') return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.26-8.3L2.98 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.73L8.44 4.05H6.58L17.8 19.84Z"/></svg>;
  return <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M14.5 3c.4 2.2 1.7 3.6 3.8 4v3.1a8.7 8.7 0 0 1-3.8-1.1v6.2a6.2 6.2 0 1 1-5.4-6.1v3.2a3.1 3.1 0 1 0 2.2 3V3h3.2Z"/></svg>;
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
  const [platformSettings, setPlatformSettings] = useState<PublicPlatformSettings | null>(null);

  useEffect(() => {
    void apiGet<PublicPlatformSettings>('/public/platform-settings').then(setPlatformSettings).catch(() => setPlatformSettings(null));
  }, []);

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
          <nav className="flex items-center gap-6 text-sm font-medium text-white/90">{navLinks.map((link) => <a key={link.href} href={link.href} className="hover:text-white">{link.label}</a>)}</nav>
          <div className="flex items-center gap-2.5 text-sm font-medium"><Link href={otherLocaleHref} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/90 hover:bg-white/10 hover:text-white" aria-label={t.nav.languageSwitch}><GlobeIcon className="h-4 w-4" /></Link><ThemeToggle labels={t.nav} className="h-9 w-9 rounded-xl" /><a href={`${dashboardUrl}/login`} className="inline-flex h-9 items-center rounded-xl border border-white/30 px-4 text-white transition-colors hover:bg-white/10">{t.nav.login}</a><a href={`${dashboardUrl}/register`} className="text-brand inline-flex h-9 items-center rounded-xl bg-white px-4 font-semibold transition-colors hover:bg-white/90">{t.nav.cta}</a></div>
        </div>
        <div dir="ltr" className="flex h-16 w-full items-center justify-between px-4 lg:hidden"><div className="flex min-w-0 items-center gap-2"><a href={`${dashboardUrl}/register`} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="text-brand flex h-7 flex-none items-center whitespace-nowrap rounded-[9px] bg-white px-3 text-xs font-semibold leading-none shadow-sm transition-colors hover:bg-white/90">{t.nav.cta}</a><a href={`${dashboardUrl}/login`} dir={locale === 'ar' ? 'rtl' : 'ltr'} className="flex h-7 flex-none items-center whitespace-nowrap rounded-[9px] border border-white/35 px-3 text-xs font-semibold leading-none text-white transition-colors hover:bg-white/10">{t.nav.login}</a></div><Link href={homeHref} aria-label={t.brand} className="flex h-9 flex-none items-center justify-center"><BrandMark label={t.brand} invert className="h-5 max-[359px]:h-[18px]" /></Link></div>
      </header>
      <div className="h-16" />
      <main>{children}</main>
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 z-[60] flex flex-col items-center gap-2 lg:hidden"><div className={`flex flex-col items-center gap-2 transition-all duration-200 ${quickControlsOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`} aria-hidden={!quickControlsOpen}><Link href={otherLocaleHref} aria-label={t.nav.languageSwitch} title={t.nav.languageSwitch} className="text-brand flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-card shadow-lg transition-transform hover:scale-105"><GlobeIcon className="h-5 w-5" /></Link><div className="flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-text-primary shadow-lg"><ThemeToggle labels={t.nav} className="h-11 w-11 rounded-full bg-transparent text-current hover:bg-black/5" /></div></div><button type="button" onClick={() => setQuickControlsOpen((value) => !value)} aria-label={quickControlsOpen ? t.nav.menuClose : t.nav.menuOpen} aria-expanded={quickControlsOpen} className="bg-brand flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl ring-1 ring-white/20 transition-transform active:scale-95">{quickControlsOpen ? <CloseIcon className="h-5 w-5" /> : <QuickControlsIcon className="h-5 w-5" />}</button></div>

      <footer className="bg-surface-card px-3 pb-3 pt-8 sm:px-5 sm:pb-5 lg:px-8 lg:pb-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#68458A] text-white shadow-[0_24px_70px_-35px_rgba(72,42,94,.55)] sm:rounded-[2.5rem]">
          <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/marketing/footer-silk.svg')" }} />
          <div aria-hidden="true" className="absolute inset-0 bg-[#321846]/20" />
          <div className="relative flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-16">
            <BrandMark label={t.brand} invert className="h-10 sm:h-12" />

            <div className="mt-10">
              <h2 className="text-2xl font-bold sm:text-3xl">{locale === 'ar' ? 'تواصل معنا' : 'Contact us'}</h2>
              <a href="mailto:info@sbaah.com" dir="ltr" className="mt-4 inline-block border-b border-white/70 pb-1 text-base text-white/90 transition-opacity hover:opacity-75 sm:text-lg">info@sbaah.com</a>
              <div className="mt-6 flex items-center justify-center gap-6">
                {platformSettings?.social_tiktok && <a href={platformSettings.social_tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white/85 transition-transform hover:scale-110 hover:text-white"><SocialIcon type="tiktok"/></a>}
                {platformSettings?.social_instagram && <a href={platformSettings.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/85 transition-transform hover:scale-110 hover:text-white"><SocialIcon type="instagram"/></a>}
                {platformSettings?.social_x && <a href={platformSettings.social_x} target="_blank" rel="noopener noreferrer" aria-label="X" className="text-white/85 transition-transform hover:scale-110 hover:text-white"><SocialIcon type="x"/></a>}
              </div>
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold sm:text-3xl">{locale === 'ar' ? 'روابط سريعة' : 'Quick links'}</h2>
              <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-sm text-white/80 sm:text-base">
                <a href={homeHref} className="hover:text-white">{locale === 'ar' ? 'الرئيسية' : 'Home'}</a>
                <a href="#pricing" className="hover:text-white">{t.nav.pricing}</a>
                <a href="#faq" className="hover:text-white">{t.nav.faq}</a>
              </nav>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
              <a href="#" className="rounded-full border border-white/55 px-5 py-2.5 text-white/85 hover:bg-white/10">{locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
              <a href="#" className="rounded-full border border-white/55 px-5 py-2.5 text-white/85 hover:bg-white/10">{locale === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</a>
            </div>
            <p className="mt-6 text-xs text-white/65 sm:text-sm">{locale === 'ar' ? 'جميع الحقوق محفوظة © سبعة 2026' : '© Sbaah 2026. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </>
  );
}
