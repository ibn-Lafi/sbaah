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
import type { BusinessCapability, UserRole } from '@sbaah/shared';
import type { ChromeDictionary } from '@/lib/i18n/dictionaries';
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
}

export interface NavGroup {
  group: string;
  label: string;
  icon: Icon;
  roles?: UserRole[];
  capability?: BusinessCapability;
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

/** Same hrefs/icons/roles regardless of language — only `label` comes from the active dictionary (`t`), so a language switch relabels the existing nav instead of needing a second, parallel list. */
export function getNavItems(t: ChromeDictionary): NavEntry[] {
  return [
    { href: '/', label: t.nav.dashboard, icon: DashboardIcon },
    {
      group: 'clients',
      label: t.nav.leads,
      icon: ClientsIcon,
      children: [
        { href: '/leads', label: t.nav.leads, icon: ClientsIcon, capability: 'crm' },
        { href: '/viewings', label: 'المعاينات', icon: ClientsIcon, capability: 'crm' },
          ],
    },
    {
      group: 'properties',
      capability: 'properties',
      label: t.nav.propertiesGroup.label,
      icon: PropertiesIcon,
      children: [
        { href: '/properties', label: t.nav.propertiesGroup.units, icon: PropertiesIcon },
        { href: '/buildings', label: t.nav.propertiesGroup.buildings, icon: BuildingsIcon },
        { href: '/projects', label: t.nav.propertiesGroup.projects, icon: ProjectsIcon, capability: 'projects' },
        { href: '/rentals', label: t.nav.propertiesGroup.rentals, icon: RentalsIcon },
      ],
    },
    { href: '/broker-marketer', label: t.nav.brokerMarketer, icon: BrokerMarketerIcon, roles: ['owner', 'admin'] },
    {
      group: 'website',
      label: t.nav.website.label,
      icon: WebsiteIcon,
      roles: ['owner', 'admin'],
      children: [
        { href: '/website/editor', label: t.nav.website.themeEditor, icon: ThemeCustomizeIcon },
        { href: '/website', label: t.nav.website.themeStore, icon: ThemeStoreIcon },
        { href: '/website/pages', label: t.nav.website.pages, icon: PagesIcon },
        { href: '/domain', label: t.nav.website.domain, icon: DomainIcon },
      ],
    },
    { href: '/apps', label: t.nav.apps, icon: AppsIcon, roles: ['owner', 'admin'] },
    { href: '/support', label: t.nav.support, icon: SupportIcon },
  ];
}
