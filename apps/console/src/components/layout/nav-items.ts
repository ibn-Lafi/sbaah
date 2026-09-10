/** Sidebar nav — flat (console has no expandable groups, unlike dashboard's "الموقع الالكتروني" group) and no per-role filtering (every console screen requires the same platform_admins access). */
import type { ComponentType } from 'react';
import { AccountsIcon, CitiesIcon, DistrictsIcon, DomainsIcon, PlansIcon, SettingsIcon, ThemesIcon } from './nav-icons';

type Icon = ComponentType<{ className?: string }>;

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/accounts', label: 'الحسابات', icon: AccountsIcon },
  { href: '/domains', label: 'طلبات الدومين', icon: DomainsIcon },
  { href: '/plans', label: 'الباقات', icon: PlansIcon },
  { href: '/themes', label: 'الثيمات', icon: ThemesIcon },
  { href: '/cities', label: 'المدن', icon: CitiesIcon },
  { href: '/districts', label: 'الأحياء', icon: DistrictsIcon },
  { href: '/settings', label: 'إعدادات المنصة', icon: SettingsIcon },
];
