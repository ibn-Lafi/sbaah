/**
 * Sidebar nav — PRODUCT_SPEC.md section 4 approved scope only. The
 * founder's mockup includes extra items (unit/building/project/rental
 * hierarchy, applicants, custom-domain self-service, an apps
 * marketplace) that go beyond the approved MVP — see
 * docs/DASHBOARD_DESIGN_SYSTEM.md "نطاق غير معتمد" before adding any
 * of them here.
 */
export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'لوحة القيادة' },
  { href: '/properties', label: 'العقارات' },
  { href: '/leads', label: 'العملاء المحتملون' },
  { href: '/site', label: 'محرر الموقع' },
  { href: '/site/preview', label: 'معاينة الموقع' },
  { href: '/team', label: 'الفريق' },
  { href: '/settings', label: 'الإعدادات' },
  { href: '/billing', label: 'الفوترة والاشتراك' },
];
