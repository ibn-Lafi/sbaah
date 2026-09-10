'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';
import { AdminAvatar } from '@/components/ui/admin-avatar';
import { NAV_ITEMS } from './nav-items';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { signOut } from '@/lib/auth/session';

interface SidebarContentProps {
  pathname: string;
  onNavigate?: () => void;
}

/** The nav list + account switcher, shared between the desktop-fixed and mobile-drawer renderings below so they never drift apart. */
function SidebarContent({ pathname, onNavigate }: SidebarContentProps) {
  const router = useRouter();
  const { admin } = useCurrentAdmin();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <>
      <div className="px-2 pb-[18px]">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-px overflow-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex h-[34px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[13px] ${
                active ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-tertiary'
              }`}
            >
              <ItemIcon className="h-[16px] w-[16px] flex-none" />
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
          <AdminAvatar />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="truncate text-xs font-semibold text-text-primary">{admin.full_name}</div>
            <div className="text-[11px] text-text-secondary">مالك المنصة</div>
          </div>
        </button>

        {accountMenuOpen && (
          <div className="absolute inset-x-2 bottom-full z-20 mb-2 flex flex-col gap-0.5 rounded-[14px] bg-surface-card p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)]">
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
    </>
  );
}

interface SidebarProps {
  /** Mobile drawer visibility (< md) — the fixed desktop sidebar (≥ md) always renders regardless of this. */
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/** Matches apps/dashboard/src/components/layout/sidebar.tsx's structure (216px, icon nav, account switcher), plus a slide-in drawer below the `md` breakpoint (UI/UX audit finding — console had no responsive handling at all below ~4 scattered breakpoint classes app-wide). */
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onMobileClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Desktop: always visible, static */}
      <div className="hidden w-[216px] flex-none flex-col border-e border-border-subtle bg-surface-card p-[10px_10px_18px] md:flex">
        <SidebarContent pathname={pathname} />
      </div>

      {/* Mobile: slide-in drawer, only mounted while open */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <div className="relative flex w-[240px] flex-none flex-col bg-surface-card p-[10px_10px_18px] shadow-[0_0_30px_rgba(31,29,34,.25)]">
            <SidebarContent pathname={pathname} onNavigate={onMobileClose} />
          </div>
        </div>
      )}
    </>
  );
}
