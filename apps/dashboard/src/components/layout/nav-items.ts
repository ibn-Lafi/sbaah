/**
 * Sidebar main nav — matches the founder's Claude Design mockup
 * ("SBAAH App - Desktop.dc.html") exactly, including its expandable
 * group pattern (buildNav()'s `hasChevron`/`navOpen` — a parent row
 * toggles open/closed to reveal indented children instead of navigating
 * itself). "الموقع الالكتروني" is that one group in this app: تخصيص
 * الثيم (/site/editor), متجر الثيمات (/site), الدومين (/domain).
 *
 * "الإعدادات"/"الفوترة والاشتراك"/"إدارة الموظفين" are NOT in this list —
 * the founder's later revision moves them into the account switcher
 * dropdown at the bottom of the sidebar instead (see sidebar.tsx), not
 * regular nav rows.
 *
 * "العقارات" here still points at /properties only — the mockup
 * consolidates properties/projects/buildings/rentals under this one nav
 * item with internal tabs (kindTabs), already built as /properties'
 * internal kind switcher.
 *
 * Each entry carries an `icon` component (nav-icons.tsx) — replaces the
 * old plain dot indicator per the founder's explicit request.
 */
import type { ComponentType } from 'react';
import type { UserRole } from '@sbaah/shared';
import {
  ApplicantsIcon,
  AppsIcon,
  ClientsIcon,
  DashboardIcon,
  DomainIcon,
  PagesIcon,
  PropertiesIcon,
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
  { href: '/properties', label: 'العقارات', icon: PropertiesIcon },
  { href: '/applicants', label: 'الوسطاء والمسوقين', icon: ApplicantsIcon, roles: ['owner', 'admin'] },
  {
    group: 'site',
    label: 'الموقع الالكتروني',
    icon: WebsiteIcon,
    roles: ['owner', 'admin'],
    children: [
      { href: '/site/editor', label: 'تخصيص الثيم', icon: ThemeCustomizeIcon },
      { href: '/site', label: 'متجر الثيمات', icon: ThemeStoreIcon },
      { href: '/site/pages', label: 'الصفحات', icon: PagesIcon },
      { href: '/domain', label: 'الدومين', icon: DomainIcon },
    ],
  },
  { href: '/apps', label: 'التطبيقات', icon: AppsIcon, roles: ['owner', 'admin'] },
];
