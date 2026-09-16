'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { SidebarToggleIcon } from './nav-icons';
import { getNavItems, isNavGroup } from './nav-items';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { dirFor } from '@/lib/i18n/locale';
import { signOut } from '@/lib/auth/session';
import type { AccountType } from '@sbaah/shared';

interface SidebarProps {
  orgName: string;
  accountType: AccountType;
}

const COLLAPSED_STORAGE_KEY = 'sbaah-sidebar-collapsed';
const FLYOUT_GAP = 8;

/** Small decorative circles + dot cluster behind the nav — same idea as the founder's reference screenshots (a gradient brand backdrop instead of a flat white panel), recolored to our own brand palette (CSS vars, so it still shifts with dark mode like every other `bg-brand`). Its own `overflow-hidden` is scoped to just this layer so it doesn't clip the hover flyouts rendered above it. */
function SidebarBackdrop() {
  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{ background: 'linear-gradient(165deg, var(--color-brand-hover), var(--color-brand) 55%, var(--color-brand-hover))' }}
    >
      <div className="absolute -top-16 -start-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute top-1/3 -end-20 h-56 w-56 rounded-full bg-white/[0.07] blur-3xl" />
      <div className="absolute bottom-24 -start-10 h-40 w-40 rounded-full bg-white/[0.08] blur-2xl" />
      <svg className="absolute bottom-4 end-2 h-16 w-16 text-white/25" viewBox="0 0 64 64" fill="currentColor">
        {[8, 24, 40, 56].flatMap((cy) => [8, 24, 40, 56].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" />))}
      </svg>
    </div>
  );
}

/**
 * Where a collapsed row's hover flyout lands — `position: fixed`, computed
 * from the trigger's own `getBoundingClientRect()` at hover time, rather
 * than CSS `absolute` anchored to the row itself. The row lives inside
 * `<nav>`'s own `overflow-y-auto` (needed so a long nav list scrolls
 * instead of overflowing the sidebar's height) — `overflow-y-auto` forces
 * the x-axis to clip too (CSS overflow spec), which silently clipped any
 * `absolute`-positioned flyout escaping the row sideways. `fixed` escapes
 * that entirely (no ancestor here sets transform/filter/perspective/
 * contain, so the viewport stays its containing block).
 */
function flyoutStyle(rect: DOMRect, dir: 'rtl' | 'ltr', top: number): CSSProperties {
  return dir === 'rtl'
    ? { position: 'fixed', top, right: window.innerWidth - rect.left + FLYOUT_GAP }
    : { position: 'fixed', top, left: rect.right + FLYOUT_GAP };
}

export function Sidebar({ orgName, accountType }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { me } = useCurrentUser();
  const { t, pages, locale } = useLocale();
  const dir = dirFor(locale);
  const roleLabel = t.roleLabels[me.user.role];
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const visibleItems = getNavItems(t).filter((item) => !item.roles || item.roles.includes(me.user.role));

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1');
    } catch {
      // localStorage unavailable (private mode/blocked) — stay expanded, no functional loss.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // best-effort only
      }
      return next;
    });
  }

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  function handleRowEnter(key: string, event: React.MouseEvent<HTMLElement>) {
    if (!collapsed) return;
    setHoveredKey(key);
    setHoveredRect(event.currentTarget.getBoundingClientRect());
  }

  function handleRowLeave() {
    setHoveredKey(null);
  }

  return (
    <div
      className={`relative z-20 hidden flex-none flex-col p-[10px_10px_18px] transition-[width] duration-200 md:flex ${
        collapsed ? 'w-[72px]' : 'w-[216px]'
      }`}
    >
      <SidebarBackdrop />

      <div className="flex items-center justify-between px-2 pb-[18px]">
        {!collapsed && <BrandMark width={102} height={23} invert />}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={t.nav.toggleSidebar}
          title={t.nav.toggleSidebar}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] text-white/70 hover:bg-white/10 hover:text-white"
        >
          <SidebarToggleIcon collapsed={collapsed} className="h-[17px] w-[17px]" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-y-auto">
        {visibleItems.map((item) => {
          if (isNavGroup(item)) {
            const hasActiveChild = item.children.some((child) => child.href === pathname);
            const isOpen = !collapsed && (openGroups[item.group] ?? hasActiveChild);
            const GroupIcon = item.icon;
            const flyoutOpen = collapsed && hoveredKey === item.group && hoveredRect;
            return (
              <div
                key={item.group}
                className="relative flex flex-col gap-px"
                onMouseEnter={(e) => handleRowEnter(item.group, e)}
                onMouseLeave={handleRowLeave}
              >
                <button
                  type="button"
                  onClick={() => !collapsed && setOpenGroups((current) => ({ ...current, [item.group]: !isOpen }))}
                  className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
                    collapsed ? 'justify-center' : ''
                  } ${hasActiveChild ? 'font-semibold text-white' : 'font-normal text-white/70 hover:bg-white/10 hover:text-white'}`}
                >
                  <GroupIcon className="h-[16px] w-[16px] flex-none" />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                      <span className="text-[10px] text-white/50">{isOpen ? '▲' : '▼'}</span>
                    </>
                  )}
                </button>

                {flyoutOpen && (
                  <div
                    style={flyoutStyle(hoveredRect, dir, hoveredRect.top)}
                    className="bg-surface-card z-30 min-w-[180px] rounded-[14px] p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)]"
                  >
                    <div className="text-text-secondary px-[14px] pt-1 pb-1.5 text-xs font-medium">{item.label}</div>
                    {item.children.map((child) => {
                      const active = pathname === child.href;
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-2.5 rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium ${
                            active ? 'text-brand bg-brand-surface' : 'text-text-primary hover:bg-surface-subtle'
                          }`}
                        >
                          <ChildIcon className="h-[15px] w-[15px] flex-none" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}

                {!collapsed &&
                  isOpen &&
                  item.children.map((child) => {
                    const active = pathname === child.href;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] pe-[10px] ps-[26px] text-[15px] ${
                          active ? 'bg-white/15 font-semibold text-white' : 'font-normal text-white/60 hover:bg-white/10 hover:text-white'
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
          const tooltipOpen = collapsed && hoveredKey === item.href && hoveredRect;
          return (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={(e) => handleRowEnter(item.href, e)}
              onMouseLeave={handleRowLeave}
            >
              <Link
                href={item.href}
                className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
                  collapsed ? 'justify-center' : ''
                } ${active ? 'bg-white/15 font-semibold text-white' : 'font-normal text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <ItemIcon className="h-[16px] w-[16px] flex-none" />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
              </Link>
              {tooltipOpen && (
                <div
                  style={flyoutStyle(hoveredRect, dir, hoveredRect.top + hoveredRect.height / 2 - 16)}
                  className="bg-surface-card text-text-primary z-30 rounded-[10px] px-3 py-1.5 text-[13px] font-medium whitespace-nowrap shadow-[0_10px_30px_rgba(31,29,34,.18)]"
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="relative mt-auto border-t border-white/15 pt-[10px]">
        <button
          type="button"
          onClick={() => setAccountMenuOpen((open) => !open)}
          className={`flex w-full items-center gap-[9px] px-2 py-[2px] text-start ${collapsed ? 'justify-center' : ''}`}
        >
          <AccountAvatar accountType={accountType} />
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col gap-px">
              <div className="truncate text-xs font-semibold text-white">{orgName}</div>
              <div className="text-[11px] text-white/60">{roleLabel}</div>
            </div>
          )}
        </button>

        {accountMenuOpen && (
          <div
            className={`bg-surface-card absolute z-20 flex flex-col gap-0.5 rounded-[14px] p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)] ${
              collapsed ? 'start-full bottom-0 ms-2 w-[200px]' : 'inset-x-2 bottom-full mb-2'
            }`}
          >
            <Link
              href="/settings"
              onClick={() => setAccountMenuOpen(false)}
              className="text-text-primary hover:bg-surface-subtle rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium"
            >
              {t.settingsNavLabel}
            </Link>
            <div className="bg-surface-subtle my-0.5 h-px" />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-danger hover:bg-danger-surface rounded-[10px] px-[14px] py-[11px] text-start text-[13px] font-medium"
            >
              {pages.settings.signOut}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
