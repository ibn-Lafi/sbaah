'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/ui/brand-mark';
import { AccountAvatar } from '@/components/ui/account-avatar';
import { getNavItems, isNavGroup } from './nav-items';
import { SettingsIcon } from './nav-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { AccountType } from '@sbaah/shared';

interface SidebarProps {
  orgName: string;
  accountType: AccountType;
}

/**
 * Matches the founder's mockup (216px, icon nav, expandable groups like
 * "الموقع الالكتروني"). "الإعدادات" هو نفس مدخل الجوال (mobile-nav.tsx) —
 * رابط أيقونة واحد يقود لصفحة /settings المُبوَّبة (الحساب/الموظفين/
 * الفوترة/بيانات الموقع)، بدل القائمة المنسدلة القديمة (حسابي/إدارة
 * الموظفين/الفوترة/تسجيل الخروج كروابط منفصلة) — تسجيل الخروج انتقل
 * لتبويب "الحساب" داخل /settings نفسها. أزرار تبديل اللغة/الوضع تبقى في
 * الهيدر (topbar.tsx) كما هي، بلا تغيير.
 */
export function Sidebar({ orgName, accountType }: SidebarProps) {
  const pathname = usePathname();
  const { me } = useCurrentUser();
  const { t } = useLocale();
  const roleLabel = t.roleLabels[me.user.role];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const visibleItems = getNavItems(t).filter((item) => !item.roles || item.roles.includes(me.user.role));
  const settingsActive = pathname === '/settings';

  return (
    <div className="border-border-subtle bg-surface-card hidden w-[216px] flex-none flex-col border-e p-[10px_10px_18px] md:flex">
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
                  onClick={() =>
                    setOpenGroups((current) => ({ ...current, [item.group]: !isOpen }))
                  }
                  className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
                    hasActiveChild ? 'text-brand font-semibold' : 'text-text-tertiary font-normal'
                  }`}
                >
                  <GroupIcon className="h-[16px] w-[16px] flex-none" />
                  <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                  <span className="text-text-placeholder text-[10px]">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen &&
                  item.children.map((child) => {
                    const active = pathname === child.href;
                    const ChildIcon = child.icon;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] pe-[10px] ps-[26px] text-[15px] ${
                          active
                            ? 'bg-brand-surface text-brand font-semibold'
                            : 'text-text-tertiary font-normal'
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
                active
                  ? 'bg-brand-surface text-brand font-semibold'
                  : 'text-text-tertiary font-normal'
              }`}
            >
              <ItemIcon className="h-[16px] w-[16px] flex-none" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-border-subtle mt-auto flex flex-col gap-px border-t pt-[10px]">
        <Link
          href="/settings"
          className={`flex h-[38px] flex-none items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${
            settingsActive ? 'bg-brand-surface text-brand font-semibold' : 'text-text-tertiary font-normal'
          }`}
        >
          <SettingsIcon className="h-[16px] w-[16px] flex-none" />
          <span className="min-w-0 flex-1 truncate">{t.settingsNavLabel}</span>
        </Link>

        <div className="flex items-center gap-[9px] px-2 pt-2">
          <AccountAvatar accountType={accountType} />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <div className="text-text-primary truncate text-xs font-semibold">{orgName}</div>
            <div className="text-text-secondary text-[11px]">{roleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
