'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { HeaderProps } from '../types';

/** px past the top before the header switches from transparent to its solid "card" look. */
const SCROLL_THRESHOLD = 24;

/**
 * الثيم الأساسي — هيدر عائم (`position: fixed`) بتصميم مستوحى من الصورة
 * المرجعية للمؤسس: شفاف (بتدرّج غامق خفيف يضمن وضوح النص الأبيض فوق أي
 * خلفية) في أعلى الصفحة، يتحوّل إلى "كرت" أبيض بزوايا دائرية وظل عند
 * التمرير. بما أنه صار خارج تدفّق الصفحة العادي (`fixed`)، يحجز مساحته
 * بنفسه عبر الفاصل (`<div className="h-20" />`) أسفله — كل صفحة تبقى
 * محمية من أي تغطية تلقائيًا. `hero-section.tsx` في هذا الثيم يسحب نفسه
 * للأعلى بهامش سالب مطابق (`-mt-20`) خلف الهيدر الشفاف، لكن فقط عند وجود
 * صورة خلفية (bannerUrl) — نفس تأثير "الهيدر فوق صورة الخلفية" بالصورة
 * المرجعية؛ الارتباط بين الرقمين (h-20 هنا و-mt-20 هناك) مقصود ويجب أن
 * يبقيا متطابقين إذا تغيّر ارتفاع الهيدر مستقبلًا.
 */
export function Header({ locale, dict, website, tenantName, otherLocaleHref }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: locale === 'ar' ? '/properties' : '/en/properties', label: dict.properties },
    { href: locale === 'ar' ? '/projects' : '/en/projects', label: dict.projects },
    { href: locale === 'ar' ? '/about' : '/en/about', label: dict.about },
  ];

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-3">
        {website.announcement_bar_text && (
          <div className={`mb-2 text-center text-xs font-medium transition-colors ${scrolled ? 'text-black/60' : 'text-white/90'}`}>
            {website.announcement_bar_text}
          </div>
        )}
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-5 transition-all duration-300 ${
            scrolled ? 'bg-white py-3 shadow-lg' : 'bg-gradient-to-b from-black/55 to-black/0 py-4'
          }`}
        >
          <Link
            href={locale === 'ar' ? '/' : '/en'}
            className={`flex items-center gap-2 text-lg font-semibold transition-colors ${scrolled ? 'text-tenant-primary' : 'text-white'}`}
          >
            {website.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={website.logo_url} alt={tenantName} className="h-8 w-auto" />
            ) : (
              tenantName
            )}
          </Link>

          <nav className={`hidden items-center gap-6 text-sm font-medium sm:flex ${scrolled ? 'text-black/70' : 'text-white/90'}`}>
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-tenant-primary">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={otherLocaleHref}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                scrolled
                  ? 'border-black/15 text-black/70 hover:border-tenant-primary hover:text-tenant-primary'
                  : 'border-white/40 text-white hover:bg-white/10'
              }`}
            >
              {dict.languageSwitch}
            </Link>
            <Link
              href={locale === 'ar' ? '/contact' : '/en/contact'}
              className={`hidden rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors sm:block ${
                scrolled
                  ? 'border-tenant-primary text-tenant-primary hover:bg-tenant-primary hover:text-white'
                  : 'border-white text-white hover:bg-white hover:text-black'
              }`}
            >
              {dict.contact}
            </Link>
          </div>
        </div>
      </div>
      <div className="h-20" />
    </>
  );
}
