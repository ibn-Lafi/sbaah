/**
 * Sidebar main nav — matches the founder's Claude Design mockup
 * ("SBAAH App - Desktop.dc.html") exactly, including its expandable
 * group pattern (buildNav()'s `hasChevron`/`navOpen` — a parent row
 * toggles open/closed to reveal indented children instead of navigating
 * itself). "تصميم الموقع" is that one group in this app: تخصيص الثيم
 * (/site/editor), متجر الثيمات (/site), الدومين (/domain).
 *
 * "الإعدادات"/"الفوترة والاشتراك" are NOT in this list — the mockup puts
 * them in the account switcher dropdown at the bottom of the sidebar
 * instead (see sidebar.tsx), not as regular nav rows.
 *
 * "العقارات" here still points at /properties only — the mockup
 * consolidates properties/projects/buildings/rentals under this one nav
 * item with internal tabs (kindTabs), already built as /properties'
 * internal kind switcher.
 */
import type { UserRole } from '@sbaah/shared';

export interface NavLeaf {
  href: string;
  label: string;
  /** Omitted = visible to every role. PRODUCT_SPEC section 8: Agent has no website/team/billing access. */
  roles?: UserRole[];
}

export interface NavGroup {
  group: string;
  label: string;
  roles?: UserRole[];
  children: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry;
}

export const NAV_ITEMS: NavEntry[] = [
  { href: '/', label: 'لوحة القيادة' },
  { href: '/leads', label: 'إدارة العملاء' },
  { href: '/properties', label: 'العقارات' },
  { href: '/team', label: 'إدارة الموظفين', roles: ['owner', 'admin'] },
  { href: '/applicants', label: 'المتقدمون للوظائف', roles: ['owner', 'admin'] },
  {
    group: 'site',
    label: 'تصميم الموقع',
    roles: ['owner', 'admin'],
    children: [
      { href: '/site/editor', label: 'تخصيص الثيم' },
      { href: '/site', label: 'متجر الثيمات' },
      { href: '/domain', label: 'الدومين' },
    ],
  },
  { href: '/apps', label: 'التطبيقات', roles: ['owner', 'admin'] },
];
