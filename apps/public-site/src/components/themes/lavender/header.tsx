'use client';

import { useEffect, useState } from 'react';
import type { HeaderProps } from '../types';

const SCROLL_THRESHOLD = 72;

export function Header({
  locale,
  dict,
  website,
  tenantName,
  otherLocaleHref,
  customPages,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const homeHref = locale === 'ar' ? '/' : '/en';
  const links = [
    { href: homeHref, label: locale === 'ar' ? 'الرئيسية' : 'Home' },
    { href: locale === 'ar' ? '/projects' : '/en/projects', label: dict.projects },
    { href: locale === 'ar' ? '/properties' : '/en/properties', label: dict.properties },
    ...customPages.slice(0, 2).map((page) => ({
      href: locale === 'ar' ? `/pages/${page.slug}` : `/en/pages/${page.slug}`,
      label: page.title,
    })),
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 bg-[#f7f5ef] text-[#171a17] transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_8px_28px_rgba(17,24,17,.10)]' : 'shadow-none'
        }`}
      >

        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:h-[76px] sm:px-6">
          <a href={homeHref} className="flex min-w-0 shrink-0 items-center" aria-label={tenantName}>
            {website.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={website.logo_url}
                alt={tenantName}
                className="max-h-10 w-auto max-w-[165px] object-contain sm:max-h-11 sm:max-w-[200px]"
              />
            ) : (
              <span className="text-xl font-semibold tracking-tight sm:text-2xl">{tenantName}</span>
            )}
          </a>

          <nav
            className="hidden items-center gap-7 text-sm font-medium lg:flex"
            aria-label={dict.menu}
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative py-2 transition-opacity after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a
              href={otherLocaleHref}
              className="text-xs font-semibold transition-opacity hover:opacity-65"
            >
              {dict.languageSwitch}
            </a>
            <a
              href={`${homeHref}#contact`}
              className="inline-flex min-h-11 items-center justify-center border border-[#171a17] px-5 text-sm font-semibold transition-colors hover:bg-[#171a17] hover:text-white"
            >
              {dict.contact}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={dict.menu}
            aria-expanded={open}
            className="border-current/30 flex h-11 w-11 items-center justify-center border lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-[#171a17] px-5 pb-8 pt-28 text-white lg:hidden">
          <nav
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col border-t border-white/20"
            aria-label={dict.menu}
          >
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-white/15 py-5 text-2xl font-medium"
              >
                <span>{link.label}</span>
                <span className="text-sm text-white/35">0{index + 1}</span>
              </a>
            ))}
          </nav>
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/20 pt-6 text-sm">
            <a href={otherLocaleHref}>{dict.languageSwitch}</a>
            <a
              href={`${homeHref}#contact`}
              onClick={() => setOpen(false)}
              className="border-b border-white/60 pb-1"
            >
              {dict.contact}
            </a>
          </div>
        </div>
      )}

    </>
  );
}
