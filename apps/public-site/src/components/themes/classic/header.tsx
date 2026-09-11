'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeaderProps } from '../types';

/** px past the top before the header switches from fully transparent to its solid brand-color look. */
const SCROLL_THRESHOLD = 24;

/**
 * الثيم الأساسي — هيدر عائم (`position: fixed`): شفاف بالكامل (بلا أي
 * خلفية) في أعلى الصفحة، يتحوّل إلى كرت بلون المنصة المخصَّص
 * (`bg-tenant-primary` — نفس "اللون الأساسي" من تخصيص الثيم، لا لون
 * ثابت مستقل) عند التمرير. بما أنه `fixed` (خارج تدفّق الصفحة)، يحجز
 * مساحته بنفسه عبر الفاصل (`<div className="h-20" />`) أسفله — كل صفحة
 * تبقى محمية من أي تغطية تلقائيًا. `hero-section.tsx` في هذا الثيم يسحب
 * نفسه للأعلى بهامش سالب مطابق (`-mt-20`) خلف الهيدر الشفاف عند وجود
 * صورة خلفية؛ الارتباط بين الرقمين (h-20 هنا و-mt-20 هناك) مقصود ويجب
 * أن يبقيا متطابقين إذا تغيّر ارتفاع الهيدر مستقبلًا.
 *
 * قائمة الجوال (`sm:hidden`) تفتح/تغلق روابط التنقل + تبديل اللغة داخل
 * لوحة منسدلة بيضاء واحدة — لا زر "تواصل معنا" (حُذف بالكامل، حسب طلب
 * المؤسس)، ولا رابط تنقل ثابت مستقل على الجوال إطلاقًا خارج هذه القائمة.
 */
export function Header({ locale, dict, website, tenantName, otherLocaleHref }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: locale === 'ar' ? '/properties' : '/en/properties', label: dict.properties },
    { href: locale === 'ar' ? '/projects' : '/en/projects', label: dict.projects },
  ];

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
        {website.announcement_bar_text && (
          <div className="mb-2 text-center text-xs font-medium text-white">{website.announcement_bar_text}</div>
        )}
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-5 py-3 text-white transition-colors duration-300 ${
            scrolled ? 'bg-tenant-primary shadow-lg' : 'bg-transparent'
          }`}
        >
          <Link href={locale === 'ar' ? '/' : '/en'} className="flex items-center gap-2 text-lg font-semibold">
            {website.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={website.logo_url} alt={tenantName} className="h-8 w-auto" />
            ) : (
              tenantName
            )}
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium sm:flex">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-opacity hover:opacity-80">
                {label}
              </Link>
            ))}
            <Link href={otherLocaleHref} className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">
              {dict.languageSwitch}
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={dict.menu}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 sm:hidden"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl bg-white p-2 text-sm font-medium text-black/80 shadow-lg sm:hidden">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-black/5">
                {label}
              </Link>
            ))}
            <Link href={otherLocaleHref} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 hover:bg-black/5">
              {dict.languageSwitch}
            </Link>
          </div>
        )}
      </div>
      <div className="h-20" />
    </>
  );
}
