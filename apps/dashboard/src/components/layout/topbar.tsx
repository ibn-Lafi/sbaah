'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AccountType } from '@sbaah/shared';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { BrandMark } from '@/components/ui/brand-mark';
import { LanguageToggle } from './language-toggle';
import { ThemeToggle } from './theme-toggle';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { signOut } from '@/lib/auth/session';

interface TopbarProps {
  title: string;
  siteUrl: string;
  accountType: AccountType;
}

/**
 * Matches the mockup's topbar exactly on desktop. Below md it becomes the
 * founder's own reference (Zid's purple, curved-bottom mobile header): brand
 * color, rounded bottom corners, and the سبعة logo (sidebar.tsx carries the
 * same mark on desktop, so it's mobile-only here) — search pill hides there
 * too (bottom nav's page list covers navigation instead). Mobile also gets
 * its own account icon (next to "زيارة الموقع") opening a small anchored
 * popover for حسابي/إدارة الموظفين/الفوترة — these normally live in the
 * desktop sidebar's bottom account-switcher dropdown, which doesn't exist on
 * phones (sidebar.tsx is `hidden md:flex`).
 */
export function Topbar({ title, siteUrl, accountType }: TopbarProps) {
  const router = useRouter();
  const { me } = useCurrentUser();
  const { t } = useLocale();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  function handleSignOut() {
    setAccountMenuOpen(false);
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <div className="bg-brand md:border-border-subtle md:bg-surface-card flex h-20 flex-none items-center gap-2 px-4 pb-5 md:h-[72px] md:gap-4 md:border-b md:px-7 md:pb-0">
      {/* pb-5 keeps the logo/title/icons clear of the content card's -mt-5 overlap (app-shell.tsx) — otherwise their bottom edges would sit under it. */}
      <div className="flex-none md:hidden">
        <BrandMark width={64} height={17} invert />
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
      <ThemeToggle />
      <LanguageToggle />
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

      <div className="relative md:hidden">
        <button
          type="button"
          onClick={() => setAccountMenuOpen((open) => !open)}
          aria-label={t.topbar.myAccount}
          title={t.topbar.myAccount}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
        >
          <AccountAvatar accountType={accountType} size={36} />
        </button>

        {accountMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
            <div className="border-border-subtle bg-surface-card absolute end-0 top-full z-50 mt-2 flex w-48 flex-col gap-0.5 rounded-[14px] border p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)]">
              {(me.user.role === 'owner' || me.user.role === 'admin') && (
                <Link
                  href="/settings"
                  onClick={() => setAccountMenuOpen(false)}
                  className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
                >
                  {t.accountMenu.settings}
                </Link>
              )}
              {(me.user.role === 'owner' || me.user.role === 'admin') && (
                <Link
                  href="/team"
                  onClick={() => setAccountMenuOpen(false)}
                  className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
                >
                  {t.accountMenu.team}
                </Link>
              )}
              {me.user.role === 'owner' && (
                <Link
                  href="/billing"
                  onClick={() => setAccountMenuOpen(false)}
                  className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
                >
                  {t.accountMenu.billing}
                </Link>
              )}
              <div className="bg-surface-subtle my-0.5 h-px" />
              <button
                type="button"
                onClick={handleSignOut}
                className="text-danger hover:bg-danger-surface rounded-[10px] px-[14px] py-[11px] text-start text-[13px] font-medium"
              >
                {t.accountMenu.signOut}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
