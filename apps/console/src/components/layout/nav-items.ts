/** Sidebar nav — flat (console has no expandable groups, unlike dashboard's "الموقع الالكتروني" group) and no per-role filtering (every console screen requires the same platform_admins access). */
import type { ComponentType } from 'react';
import { AccountsIcon, CitiesIcon, DistrictsIcon, FaqIcon, PlansIcon, SettingsIcon, SupportIcon, ThemesIcon } from './nav-icons';

type Icon = ComponentType<{ className?: string }>;

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

/** No "طلبات الدومين" entry — custom-domain verification is fully self-service now (real DNS check triggered from the owner's own dashboard), no console review step exists to link to. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'نظرة عامة', icon: AccountsIcon },
  { href: '/operations', label: 'تشغيل المنصة', icon: AccountsIcon },
  { href: '/accounts', label: 'الحسابات', icon: AccountsIcon },
  { href: '/plans', label: 'الباقات', icon: PlansIcon },
  { href: '/themes', label: 'الثيمات', icon: ThemesIcon },
  { href: '/cities', label: 'المدن', icon: CitiesIcon },
  { href: '/districts', label: 'الأحياء', icon: DistrictsIcon },
  { href: '/faqs', label: 'الأسئلة الشائعة', icon: FaqIcon },
  { href: '/support', label: 'التذاكر والدعم', icon: SupportIcon },
  { href: '/settings', label: 'إعدادات المنصة', icon: SettingsIcon },
];
