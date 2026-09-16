'use client';

import { BrandMark } from '@/components/ui/brand-mark';
import { LanguageToggle } from './language-toggle';
import { ThemeToggle } from './theme-toggle';
import { useLocale } from '@/lib/i18n/locale-context';

interface TopbarProps {
  title: string;
  siteUrl: string;
}

/**
 * Matches the mockup's topbar exactly on desktop. Below md it becomes the
 * founder's own reference (Zid's purple, curved-bottom mobile header): brand
 * color, rounded bottom corners, and the سبعة logo (sidebar.tsx carries the
 * same mark on desktop, so it's mobile-only here) — search pill hides there
 * too (bottom nav's page list covers navigation instead). The language/theme
 * toggles and account icon used to also show on mobile here; both are
 * desktop-only now — mobile reaches all of that (plus تسجيل الخروج) through
 * the bottom nav's new "الإعدادات" entry instead (mobile-nav.tsx), which
 * now owns account-level actions on phones.
 */
export function Topbar({ title, siteUrl }: TopbarProps) {
  const { t } = useLocale();

  return (
    <div className="bg-brand md:border-border-subtle md:bg-surface-card flex h-20 flex-none items-center gap-2 px-4 pb-5 md:h-[72px] md:gap-4 md:border-b md:px-7 md:pb-0">
      {/* pb-5 keeps the logo/title/icons clear of the content card's -mt-5 overlap (app-shell.tsx) — otherwise their bottom edges would sit under it. */}
      <div className="flex-none md:hidden">
        <BrandMark width={39} height={17} invert />
      </div>
      <div className="md:text-text-primary min-w-0 flex-1 truncate text-[15px] font-semibold text-white md:flex-none md:text-[19px]">
        {title}
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="bg-surface-card hidden h-[42px] w-[280px] items-center gap-[10px] rounded-full px-4 shadow-[0_1px_6px_rgba(31,29,34,.11)] md:flex">
        <span className="border-text-secondary h-[14px] w-[14px] flex-none rounded-full border-[1.6px]" />
        <input
          type="text"
          placeholder={t.topbar.searchPlaceholder}
          className="text-text-primary flex-1 border-none bg-transparent text-[13px] outline-none"
        />
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <a
        href={siteUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={t.topbar.visitSite}
        title={t.topbar.visitSite}
        className="md:bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15 text-white md:h-[42px] md:w-[42px] md:text-text-primary"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]"
        >
          <path d="M14 4h6v6M10 14 20 4M13 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-6" />
        </svg>
      </a>
    </div>
  );
}
