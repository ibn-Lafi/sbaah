'use client';

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

/** Matches the sidebar in the founder's mockup exactly (216px, dot-indicator nav, account switcher). */
export function Sidebar({ orgName, accountType, roleLabel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
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

      <div className="border-t border-border-subtle pt-[10px]">
        <div className="flex items-center gap-[9px] px-2 py-[2px]">
          <AccountAvatar accountType={accountType} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="truncate text-xs font-semibold text-text-primary">{orgName}</div>
            <div className="text-[11px] text-text-secondary">{roleLabel}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-text-tertiary hover:bg-surface-subtle hover:text-danger"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
