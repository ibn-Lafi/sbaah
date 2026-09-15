'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AccountType } from '@sbaah/shared';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { BrandMark } from '@/components/ui/brand-mark';
import { getNavItems, isNavGroup, type NavEntry, type NavLeaf } from './nav-items';
import { ChevronIcon, CloseIcon, MenuIcon, SettingsIcon } from './nav-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';

interface MobileNavProps {
  orgName: string;
  accountType: AccountType;
}

/**
 * The 3 quick-access slots on the bottom bar itself — the founder's
 * explicit picks. A plain string pins that leaf's href directly; 'properties'
 * pins the "العقارات" group by its `group` key instead, using the group's
 * own icon/label with its first child (الوحدات /properties) as the tap
 * target, while lighting up for a visit to ANY of the group's pages
 * (العمارات/المشاريع/الإيجارات included) — not just /properties itself.
 */
const PINNED_KEYS = ['/', '/leads', 'properties'];

interface PinnedNavItem {
  key: string;
  href: string;
  label: string;
  icon: NavLeaf['icon'];
  activeHrefs: string[];
}

function getPinnedItems(items: NavEntry[]): PinnedNavItem[] {
  const result: PinnedNavItem[] = [];
  for (const key of PINNED_KEYS) {
    const match = items.find((item) =>
      isNavGroup(item) ? item.group === key : item.href === key,
    );
    if (!match) continue;
    if (isNavGroup(match)) {
      const firstChild = match.children[0];
      if (!firstChild) continue;
      result.push({
        key,
        href: firstChild.href,
        label: match.label,
        icon: match.icon,
        activeHrefs: match.children.map((child) => child.href),
      });
    } else {
      result.push({ key, href: match.href, label: match.label, icon: match.icon, activeHrefs: [match.href] });
    }
  }
  return result;
}

/**
 * Mobile-only bottom nav (md:hidden) — the sidebar (sidebar.tsx) is fixed-
 * width and desktop-only, so phones need their own chrome. Matches the
 * founder's Zid reference screenshots: a floating pill bar with the 3
 * most-used pages, and a circular button that opens a partial-width sheet
 * listing every other page, with "الإعدادات" pinned in its own row below
 * that list rather than sharing the bottom pill bar.
 * حسابي/إدارة الموظفين/الفوترة/تسجيل الخروج all live inside /settings now
 * (its tabbed shell) — topbar.tsx no longer has a mobile account popover.
 */
export function MobileNav({ orgName, accountType }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
  const { t } = useLocale();
  const roleLabel = t.roleLabels[me.user.role];
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const visibleItems = getNavItems(t).filter((item) => !item.roles || item.roles.includes(me.user.role));
  const pinnedItems: PinnedNavItem[] = getPinnedItems(visibleItems);
  const settingsActive = pathname === '/settings';

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

  /** Closes the sheet first, then navigates once its slide-out transition has actually played — a plain <Link> would unmount everything instantly and the closing motion would never be seen. */
  function handleNavigate(event: MouseEvent, href: string) {
    event.preventDefault();
    setSheetOpen(false);
    window.setTimeout(() => router.push(href), 200);
  }

  return (
    <div className="md:hidden">
      <div
        className="fixed inset-x-4 z-40 flex items-center justify-center gap-2"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={t.mobileNav.morePages}
          title={t.mobileNav.morePages}
          className="bg-brand flex h-12 w-12 flex-none items-center justify-center rounded-full text-white shadow-[0_10px_30px_rgba(104,69,138,.4)]"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <nav className="border-border-subtle bg-surface-card flex h-12 flex-none items-center gap-1 rounded-full border px-2 shadow-[0_10px_30px_rgba(31,29,34,.16)]">
          {pinnedItems.map(({ key, href, label, icon: ItemIcon, activeHrefs }) => {
            const active = activeHrefs.includes(pathname);
            return (
              <Link
                key={key}
                href={href}
                className={`flex flex-none flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1 text-[10px] leading-none ${
                  active
                    ? 'bg-brand-surface text-brand font-semibold'
                    : 'text-text-tertiary font-normal'
                }`}
              >
                <ItemIcon className="h-[17px] w-[17px]" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Backdrop + partial-width slide-in drawer (founder's Zid reference: the sheet never covers the whole screen — a strip of the page stays visible, dimmed, behind it). Both stay mounted so the close transition actually plays instead of an instant unmount. */}
      <div
        aria-hidden={!sheetOpen}
        onClick={() => setSheetOpen(false)}
        className={`fixed inset-0 z-50 bg-black/45 transition-opacity duration-300 ${
          sheetOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!sheetOpen}
        className={`bg-surface-card rounded-card fixed inset-y-3 right-0 z-50 flex w-[82%] max-w-[340px] flex-col overflow-hidden shadow-[0_0_40px_rgba(31,29,34,.25)] transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="border-border-subtle flex h-14 flex-none items-center justify-between border-b px-4">
          <BrandMark width={78} height={20} />
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            aria-label={t.mobileNav.close}
            className="text-text-tertiary hover:bg-surface-subtle flex h-9 w-9 items-center justify-center rounded-full"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto overscroll-contain p-3">
          <div className="bg-surface-subtle flex items-center gap-[9px] rounded-[14px] px-3 py-3">
            <AccountAvatar accountType={accountType} />
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <div className="text-text-primary truncate text-[13px] font-semibold">{orgName}</div>
              <div className="text-text-secondary text-[11px]">{roleLabel}</div>
            </div>
          </div>

          <nav className="mt-2 flex flex-col gap-px">
            {visibleItems.map((item) => {
              if (isNavGroup(item)) {
                const hasActiveChild = item.children.some((child) => child.href === pathname);
                const isOpen = openGroups[item.group] ?? hasActiveChild;
                const GroupIcon = item.icon;
                return (
                  <div key={item.group} className="mt-3 flex flex-col gap-px">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({ ...current, [item.group]: !isOpen }))
                      }
                      className={`flex h-11 flex-none items-center gap-2 rounded-[10px] px-[10px] text-[15px] ${
                        isOpen
                          ? 'text-text-primary font-semibold'
                          : 'text-text-tertiary font-normal'
                      }`}
                    >
                      <GroupIcon className="h-[17px] w-[17px] flex-none" />
                      <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                      <ChevronIcon open={isOpen} className="h-[14px] w-[14px] flex-none" />
                    </button>
                    {isOpen && (
                      <div className="border-border-subtle me-[13px] flex flex-col gap-px border-e ps-[13px]">
                        {item.children.map((child) => {
                          const active = pathname === child.href;
                          const ChildIcon = child.icon;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={(e) => handleNavigate(e, child.href)}
                              className={`flex h-11 flex-none items-center gap-2 rounded-[10px] px-[13px] text-[15px] ${
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
                    )}
                  </div>
                );
              }

              const active = pathname === item.href;
              const ItemIcon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavigate(e, item.href)}
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
        </div>

        <div
          className="border-border-subtle flex-none border-t p-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <Link
            href="/settings"
            onClick={(e) => handleNavigate(e, '/settings')}
            className={`border-border-subtle flex h-11 flex-none items-center gap-2 rounded-[10px] border px-[10px] text-[15px] ${
              settingsActive
                ? 'bg-brand-surface text-brand font-semibold'
                : 'text-text-primary font-normal'
            }`}
          >
            <SettingsIcon className="h-[17px] w-[17px] flex-none" />
            {t.mobileNav.settings}
          </Link>
        </div>
      </div>
    </div>
  );
}
