'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AccountType } from '@sbaah/shared';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { BrandMark } from '@/components/ui/brand-mark';
import { NAV_ITEMS, isNavGroup, type NavEntry, type NavLeaf } from './nav-items';
import { CloseIcon, MenuIcon } from './nav-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { signOut } from '@/lib/auth/session';

interface MobileNavProps {
  orgName: string;
  accountType: AccountType;
  roleLabel: string;
}

/** The 3 items pinned on the bottom bar itself — the founder's explicit picks, matching NAV_ITEMS' own first 3 entries so both stay in sync automatically if their hrefs/labels ever change. */
const PINNED_HREFS = ['/', '/leads', '/properties'];

function isPinnedLeaf(item: NavEntry): item is NavLeaf {
  return !isNavGroup(item) && PINNED_HREFS.includes(item.href);
}

/**
 * Mobile-only bottom nav (md:hidden) — the sidebar (sidebar.tsx) is fixed-
 * width and desktop-only, so phones need their own chrome. Matches the
 * founder's Zid reference screenshots: a floating pill bar with the 3
 * most-used pages, plus a circular button that opens a full-screen sheet
 * listing every other page (and the account actions that live in the
 * desktop sidebar's bottom dropdown — settings/team/billing/sign-out —
 * since there's no sidebar here to hold them).
 */
export function MobileNav({ orgName, accountType, roleLabel }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
  const [sheetOpen, setSheetOpen] = useState(false);
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(me.user.role));
  const pinnedItems = visibleItems.filter(isPinnedLeaf);

  useEffect(() => {
    if (!sheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sheetOpen]);

  // A page navigation from inside the sheet should close it, not leave it open behind the new page.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <div className="md:hidden">
      <div
        className="fixed inset-x-4 z-40 flex items-center gap-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <nav className="border-border-subtle bg-surface-card flex h-14 flex-1 items-center justify-evenly gap-1 rounded-full border px-2 shadow-[0_10px_30px_rgba(31,29,34,.16)]">
          {pinnedItems.map(({ href, label, icon: ItemIcon }) => {
            const active = pathname === href;
            return active ? (
              <Link
                key={href}
                href={href}
                className="bg-brand-surface text-brand flex h-10 flex-none items-center gap-2 rounded-full px-4 text-[13px] font-semibold"
              >
                <ItemIcon className="h-[18px] w-[18px] flex-none" />
                {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className="text-text-tertiary flex h-10 w-10 flex-none items-center justify-center rounded-full"
              >
                <ItemIcon className="h-[19px] w-[19px]" />
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="بقية الصفحات"
          title="بقية الصفحات"
          className="bg-brand flex h-14 w-14 flex-none items-center justify-center rounded-full text-white shadow-[0_10px_30px_rgba(104,69,138,.4)]"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>

      {sheetOpen && (
        <div className="bg-surface-card fixed inset-0 z-50 flex flex-col">
          <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
            <BrandMark width={78} height={20} />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="إغلاق"
              className="text-text-tertiary hover:bg-surface-subtle flex h-9 w-9 items-center justify-center rounded-full"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex-1 overflow-auto p-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
          >
            <div className="bg-surface-subtle flex items-center gap-[9px] rounded-[14px] px-3 py-3">
              <AccountAvatar accountType={accountType} />
              <div className="flex min-w-0 flex-1 flex-col gap-px">
                <div className="text-text-primary truncate text-[13px] font-semibold">
                  {orgName}
                </div>
                <div className="text-text-secondary text-[11px]">{roleLabel}</div>
              </div>
            </div>

            <nav className="mt-2 flex flex-col gap-px">
              {visibleItems.map((item) => {
                if (isNavGroup(item)) {
                  const GroupIcon = item.icon;
                  return (
                    <div key={item.group} className="mt-3 flex flex-col gap-px">
                      <div className="text-text-placeholder flex h-9 flex-none items-center gap-2 px-[10px] text-[13px] font-medium">
                        <GroupIcon className="h-[15px] w-[15px] flex-none" />
                        {item.label}
                      </div>
                      {item.children.map((child) => {
                        const active = pathname === child.href;
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex h-11 flex-none items-center gap-2 rounded-[10px] pe-[10px] ps-[26px] text-[15px] ${
                              active
                                ? 'bg-brand-surface text-brand font-semibold'
                                : 'text-text-tertiary font-normal'
                            }`}
                          >
                            <ChildIcon className="h-[17px] w-[17px] flex-none" />
                            {child.label}
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
                    className={`flex h-11 flex-none items-center gap-2 rounded-[10px] px-[10px] text-[15px] ${
                      active
                        ? 'bg-brand-surface text-brand font-semibold'
                        : 'text-text-tertiary font-normal'
                    }`}
                  >
                    <ItemIcon className="h-[17px] w-[17px] flex-none" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-border-subtle mt-3 flex flex-col gap-px border-t pt-3">
              {(me.user.role === 'owner' || me.user.role === 'admin') && (
                <Link
                  href="/settings"
                  className="text-text-tertiary flex h-11 flex-none items-center rounded-[10px] px-[10px] text-[15px] font-normal"
                >
                  حسابي
                </Link>
              )}
              {(me.user.role === 'owner' || me.user.role === 'admin') && (
                <Link
                  href="/team"
                  className="text-text-tertiary flex h-11 flex-none items-center rounded-[10px] px-[10px] text-[15px] font-normal"
                >
                  إدارة الموظفين
                </Link>
              )}
              {me.user.role === 'owner' && (
                <Link
                  href="/billing"
                  className="text-text-tertiary flex h-11 flex-none items-center rounded-[10px] px-[10px] text-[15px] font-normal"
                >
                  الفوترة والاشتراك
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="text-danger flex h-11 flex-none items-center rounded-[10px] px-[10px] text-start text-[15px] font-normal"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
