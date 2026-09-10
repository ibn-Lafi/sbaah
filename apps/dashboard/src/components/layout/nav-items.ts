/**
 * Sidebar main nav — matches the founder's Claude Design mockup
 * ("SBAAH App - Desktop.dc.html") exactly: 8 items, in this order.
 * "الإعدادات"/"الفوترة والاشتراك" are NOT in this list — the mockup puts
 * them in the account switcher dropdown at the bottom of the sidebar
 * instead (see sidebar.tsx), not as regular nav rows.
 *
 * "العقارات" here still points at /properties only — the mockup
 * consolidates properties/projects/buildings/rentals under this one nav
 * item with internal tabs (kindTabs); that page-level restructuring is
 * separate, larger follow-up work, not done in this pass.
 */
import type { UserRole } from '@sbaah/shared';

export interface NavItem {
  href: string;
  label: string;
  /** Omitted = visible to every role. PRODUCT_SPEC section 8: Agent has no website/team/billing access. */
  roles?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'لوحة القيادة' },
  { href: '/leads', label: 'إدارة العملاء' },
  { href: '/properties', label: 'العقارات' },
  { href: '/team', label: 'إدارة الموظفين', roles: ['owner', 'admin'] },
  { href: '/applicants', label: 'المتقدمون للوظائف', roles: ['owner', 'admin'] },
  { href: '/site', label: 'تصميم الموقع', roles: ['owner', 'admin'] },
  { href: '/domain', label: 'الدومين', roles: ['owner', 'admin'] },
  { href: '/apps', label: 'التطبيقات', roles: ['owner', 'admin'] },
];
