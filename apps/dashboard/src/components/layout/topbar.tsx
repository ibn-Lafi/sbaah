'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AccountType } from '@sbaah/shared';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { signOut } from '@/lib/auth/session';

interface TopbarProps {
  title: string;
  siteUrl: string;
  accountType: AccountType;
}

/**
 * Matches the mockup's topbar exactly on desktop; below md the search pill
 * hides (bottom nav's page list covers navigation there) and spacing/sizes
 * shrink so the title + action buttons always fit a phone screen without
 * wrapping. Mobile also gets its own account icon (next to "زيارة الموقع")
 * opening a small anchored popover for حسابي/إدارة الموظفين/الفوترة —
 * these normally live in the desktop sidebar's bottom account-switcher
 * dropdown, which doesn't exist on phones (sidebar.tsx is `hidden md:flex`).
 */
export function Topbar({ title, siteUrl, accountType }: TopbarProps) {
  const router = useRouter();
  const { me } = useCurrentUser();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  function handleSignOut() {
    setAccountMenuOpen(false);
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <div className="border-border-subtle bg-surface-card flex h-14 flex-none items-center gap-2 border-b px-4 md:h-[72px] md:gap-4 md:px-7">
      <div className="text-text-primary min-w-0 flex-1 truncate text-[16px] font-semibold md:flex-none md:text-[19px]">
        {title}
      </div>
      <div className="hidden flex-1 md:block" />
      <div className="bg-surface-card hidden h-[42px] w-[280px] items-center gap-[10px] rounded-full px-4 shadow-[0_1px_6px_rgba(31,29,34,.11)] md:flex">
        <span className="border-text-secondary h-[14px] w-[14px] flex-none rounded-full border-[1.6px]" />
        <input
          type="text"
          placeholder="بحث..."
          className="text-text-primary flex-1 border-none bg-transparent text-[13px] outline-none"
        />
      </div>
      <a
        href={siteUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="زيارة الموقع"
        title="زيارة الموقع"
        className="bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-full md:h-[42px] md:w-[42px]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1F1D22"
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
          aria-label="حسابي"
          title="حسابي"
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
                  حسابي
                </Link>
              )}
              {(me.user.role === 'owner' || me.user.role === 'admin') && (
                <Link
                  href="/team"
                  onClick={() => setAccountMenuOpen(false)}
                  className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
                >
                  إدارة الموظفين
                </Link>
              )}
              {me.user.role === 'owner' && (
                <Link
                  href="/billing"
                  onClick={() => setAccountMenuOpen(false)}
                  className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
                >
                  الفوترة والاشتراك
                </Link>
              )}
              <div className="bg-surface-subtle my-0.5 h-px" />
              <button
                type="button"
                onClick={handleSignOut}
                className="text-danger hover:bg-danger-surface rounded-[10px] px-[14px] py-[11px] text-start text-[13px] font-medium"
              >
                تسجيل الخروج
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
