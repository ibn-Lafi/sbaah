/**
 * Sidebar main nav — matches the founder's Claude Design mockup
 * ("SBAAH App - Desktop.dc.html"), including its expandable group pattern
 * (buildNav()'s `hasChevron`/`navOpen` — a parent row toggles open/closed
 * to reveal indented children instead of navigating itself). Two groups
 * use that pattern: "العقارات" (الوحدات /properties، العمارات /buildings،
 * المشاريع /projects، الإيجارات /rentals — each its own real page/route,
 * not a query-param tab inside one page) and "الموقع الالكتروني" (تخصيص
 * متجر الثيمات /website، الصفحات /website/pages، والدومين /domain. تخصيص الثيم
 * يُفتح من زر تخصيص الثيم داخل بطاقة الثيم المختار في متجر الثيمات).
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
import type { BusinessCapability, Permission, UserRole } from '@sbaah/shared';
import type { ChromeDictionary } from '@/lib/i18n/dictionaries';
import {
  AppsIcon,
  ClientsIcon,
  CalendarIcon,
  DashboardIcon,
  DomainIcon,
  PagesIcon,
  ProjectsIcon,
  PropertiesIcon,
  RentalsIcon,
  ThemeStoreIcon,
  WebsiteIcon,
  SupportIcon,
} from './nav-icons';

type Icon = ComponentType<{ className?: string }>;

export interface NavLeaf {
  href: string;
  label: string;
  icon: Icon;
  /** Omitted = visible to every role. PRODUCT_SPEC section 8: Agent has no website/team/billing access. */
  roles?: UserRole[];
  capability?: BusinessCapability;
  permission?: Permission;
}

export interface NavGroup {
  group: string;
  label: string;
  icon: Icon;
  roles?: UserRole[];
  capability?: BusinessCapability;
  permission?: Permission;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

/** Same hrefs/icons/roles regardless of language — only `label` comes from the active dictionary (`t`), so a language switch relabels the existing nav instead of needing a second, parallel list. */
export function getNavItems(t: ChromeDictionary): NavEntry[] {
  return [
    { href: '/', label: t.nav.dashboard, icon: DashboardIcon, permission: 'dashboard.read' },
    { href: '/leads', label: t.nav.leads, icon: ClientsIcon, capability: 'crm', permission: 'crm.read' },
    { href: '/viewings', label: 'التقويم', icon: CalendarIcon, capability: 'crm', permission: 'appointments.read' },
    { href: '/contracts', label: 'العقود', icon: PagesIcon, permission: 'contracts.read' },
    {
      group: 'properties',
      capability: 'properties',
      permission: 'properties.read',
      label: t.nav.propertiesGroup.label,
      icon: PropertiesIcon,
      children: [
        { href: '/properties', label: t.nav.propertiesGroup.all, icon: PropertiesIcon, permission: 'properties.read' },
        { href: '/projects', label: t.nav.propertiesGroup.projects, icon: ProjectsIcon, capability: 'projects', permission: 'projects.read' },
      ],
    },
    {
      group: 'rent-plus',
      label: t.nav.rentPlus.label,
      permission: 'ejar_plus.read',
      icon: RentalsIcon,
      children: [
        { href: '/rent-plus/maintenance', label: t.nav.rentPlus.maintenance, icon: SupportIcon },
        { href: '/rent-plus/payments', label: t.nav.rentPlus.payments, icon: RentalsIcon },
        { href: '/rent-plus/tenants', label: t.nav.rentPlus.tenants, icon: ClientsIcon },
      ],
    },
    {
      group: 'website',
      label: t.nav.website.label,
      icon: WebsiteIcon,
      roles: ['owner', 'admin'],
      permission: 'website.read',
      children: [
        { href: '/website', label: t.nav.website.themeStore, icon: ThemeStoreIcon, permission: 'website.read' },
        { href: '/website/pages', label: t.nav.website.pages, icon: PagesIcon, permission: 'website.pages.manage' },
        { href: '/domain', label: t.nav.website.domain, icon: DomainIcon, permission: 'website.domain.manage' },
      ],
    },
    { href: '/apps', label: 'سبعة Ai', icon: AppsIcon, permission: 'ai.assistant.use' },
    { href: '/support', label: t.nav.support, icon: SupportIcon },
  ];
}
