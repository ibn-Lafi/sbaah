'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { NAV_ITEMS } from './nav-items';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { signOut } from '@/lib/auth/session';
import type { AccountType } from '@sbaah/shared';

interface SidebarProps {
  orgName: string;
  accountType: AccountType;
  /** e.g. "صلاحية كاملة" for Owner — varies by role (PRODUCT_SPEC section 8), never hardcoded here. */
  roleLabel: string;
}

/** Matches the founder's mockup exactly (216px, dot-indicator nav, account switcher with a حسابي/الفوترة/خروج dropdown — settings and billing are NOT regular nav rows). */
export function Sidebar({ orgName, accountType, roleLabel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(me.user.role));

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <div className="flex w-[216px] flex-none flex-col border-e border-border-subtle bg-surface-card p-[10px_10px_18px]">
      <div className="px-2 pb-[18px]">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-auto">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[34px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[13px] ${
                active ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-tertiary'
              }`}
            >
              <span
                className="h-[5px] w-[5px] flex-none rounded-full"
                style={{ background: active ? 'var(--color-brand)' : 'var(--color-border-secondary)' }}
              />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-border-subtle pt-[10px]">
        <button
          type="button"
          onClick={() => setAccountMenuOpen((open) => !open)}
          className="flex w-full items-center gap-[9px] px-2 py-[2px] text-start"
        >
          <AccountAvatar accountType={accountType} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="truncate text-xs font-semibold text-text-primary">{orgName}</div>
            <div className="text-[11px] text-text-secondary">{roleLabel}</div>
          </div>
        </button>

        {accountMenuOpen && (
          <div className="absolute inset-x-2 bottom-full z-20 mb-2 flex flex-col gap-0.5 rounded-[14px] bg-surface-card p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)]">
            {(me.user.role === 'owner' || me.user.role === 'admin') && (
              <Link
                href="/settings"
                onClick={() => setAccountMenuOpen(false)}
                className="rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium text-text-primary hover:bg-surface-subtle"
              >
                حسابي
              </Link>
            )}
            {me.user.role === 'owner' && (
              <Link
                href="/billing"
                onClick={() => setAccountMenuOpen(false)}
                className="rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium text-text-primary hover:bg-surface-subtle"
              >
                الفوترة والاشتراك
              </Link>
            )}
            <div className="my-0.5 h-px bg-surface-subtle" />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-[10px] px-[14px] py-[11px] text-start text-[13px] font-medium text-danger hover:bg-danger-surface"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
