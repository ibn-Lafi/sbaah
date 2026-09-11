'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { NAV_ITEMS, isNavGroup } from './nav-items';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { signOut } from '@/lib/auth/session';
import type { AccountType } from '@sbaah/shared';

interface SidebarProps {
  orgName: string;
  accountType: AccountType;
  /** e.g. "صلاحية كاملة" for Owner — varies by role (PRODUCT_SPEC section 8), never hardcoded here. */
  roleLabel: string;
}

/** Matches the founder's mockup (216px, icon nav, expandable groups like "الموقع الالكتروني", account switcher with a حسابي/الفوترة/خروج dropdown). */
export function Sidebar({ orgName, accountType, roleLabel }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(me.user.role));

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <div className="flex w-[216px] flex-none flex-col border-e border-border-subtle bg-surface-card p-[10px_10px_18px]">
      <div className="px-2 pb-[18px]">
        <BrandMark />
      </div>

      <nav className="flex flex-col gap-px overflow-auto">
        {visibleItems.map((item) => {
          if (isNavGroup(item)) {
            const hasActiveChild = item.children.some((child) => child.href === pathname);
            const isOpen = openGroups[item.group] ?? hasActiveChild;
            const GroupIcon = item.icon;
            return (
              <div key={item.group} className="flex flex-col gap-px">
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [item.group]: !isOpen }))}
                  className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
                    hasActiveChild ? 'font-semibold text-brand' : 'font-normal text-text-tertiary'
                  }`}
                >
                  <GroupIcon className="h-[16px] w-[16px] flex-none" />
                  <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                  <span className="text-[10px] text-text-placeholder">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen &&
                  item.children.map((child) => {
                    const active = pathname === child.href;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] ps-[26px] pe-[10px] text-[15px] ${
                          active ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-tertiary'
                        }`}
                      >
                        <ChildIcon className="h-[16px] w-[16px] flex-none" />
                        <span className="min-w-0 flex-1 truncate">{child.label}</span>
                      </Link>
                    );
                  })}
              </div>
            );
          }

          const active = pathname === item.href;
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
                active ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-tertiary'
              }`}
            >
              <ItemIcon className="h-[16px] w-[16px] flex-none" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto border-t border-border-subtle pt-[10px]">
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
            {(me.user.role === 'owner' || me.user.role === 'admin') && (
              <Link
                href="/team"
                onClick={() => setAccountMenuOpen(false)}
                className="rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium text-text-primary hover:bg-surface-subtle"
              >
                إدارة الموظفين
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
