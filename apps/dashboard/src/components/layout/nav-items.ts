/**
 * Sidebar main nav — matches the founder's Claude Design mockup
 * ("SBAAH App - Desktop.dc.html"), including its expandable group pattern
 * (buildNav()'s `hasChevron`/`navOpen` — a parent row toggles open/closed
 * to reveal indented children instead of navigating itself). Two groups
 * use that pattern: "العقارات" (الوحدات /properties، العمارات /buildings،
 * المشاريع /projects، الإيجارات /rentals — each its own real page/route,
 * not a query-param tab inside one page) and "الموقع الالكتروني" (تخصيص
 * الثيم /website/editor، متجر الثيمات /website، الصفحات /website/pages، الدومين
 * /domain).
 *
 * "الإعدادات"/"الفوترة والاشتراك"/"إدارة الموظفين" are NOT in this list —
 * the founder's later revision moves them into the account switcher
 * dropdown at the bottom of the sidebar instead (see sidebar.tsx), not
 * regular nav rows.
 *
 * Each entry carries an `icon` component (nav-icons.tsx) — replaces the
 * old plain dot indicator per the founder's explicit request.
 */
import type { ComponentType } from 'react';
import type { UserRole } from '@sbaah/shared';
import {
  AppsIcon,
  BrokerMarketerIcon,
  BuildingsIcon,
  ClientsIcon,
  DashboardIcon,
  DomainIcon,
  PagesIcon,
  ProjectsIcon,
  PropertiesIcon,
  RentalsIcon,
  ThemeCustomizeIcon,
  ThemeStoreIcon,
  WebsiteIcon,
} from './nav-icons';

type Icon = ComponentType<{ className?: string }>;

export interface NavLeaf {
  href: string;
  label: string;
  icon: Icon;
  /** Omitted = visible to every role. PRODUCT_SPEC section 8: Agent has no website/team/billing access. */
  roles?: UserRole[];
}

export interface NavGroup {
  group: string;
  label: string;
  icon: Icon;
  roles?: UserRole[];
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

export const NAV_ITEMS: NavEntry[] = [
  { href: '/', label: 'لوحة القيادة', icon: DashboardIcon },
  { href: '/leads', label: 'إدارة العملاء', icon: ClientsIcon },
  {
    group: 'properties',
    label: 'العقارات',
    icon: PropertiesIcon,
    children: [
      { href: '/properties', label: 'الوحدات', icon: PropertiesIcon },
      { href: '/buildings', label: 'العمارات', icon: BuildingsIcon },
      { href: '/projects', label: 'المشاريع', icon: ProjectsIcon },
      { href: '/rentals', label: 'الإيجارات', icon: RentalsIcon },
    ],
  },
  { href: '/broker-marketer', label: 'الوسطاء والمسوقين', icon: BrokerMarketerIcon, roles: ['owner', 'admin'] },
  {
    group: 'website',
    label: 'الموقع الالكتروني',
    icon: WebsiteIcon,
    roles: ['owner', 'admin'],
    children: [
      { href: '/website/editor', label: 'تخصيص الثيم', icon: ThemeCustomizeIcon },
      { href: '/website', label: 'متجر الثيمات', icon: ThemeStoreIcon },
      { href: '/website/pages', label: 'الصفحات', icon: PagesIcon },
      { href: '/domain', label: 'الدومين', icon: DomainIcon },
    ],
  },
  { href: '/apps', label: 'التطبيقات', icon: AppsIcon, roles: ['owner', 'admin'] },
];
