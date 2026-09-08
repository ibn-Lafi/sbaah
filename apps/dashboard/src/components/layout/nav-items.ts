/**
 * Sidebar nav. PRODUCT_SPEC.md section 4.1's property hierarchy
 * (project/building) and section 4.2's rentals were approved after
 * docs/DASHBOARD_DESIGN_SYSTEM.md was first written — their entries here
 * are added only as each screen actually gets built (26/42, 27/42), not
 * ahead of time. Still explicitly out of scope: job applicants and an
 * apps/integrations marketplace (PRODUCT_SPEC.md section 4, declined).
 */
export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'لوحة القيادة' },
  { href: '/properties', label: 'العقارات' },
  { href: '/projects', label: 'المشاريع' },
  { href: '/buildings', label: 'العمارات' },
  { href: '/leads', label: 'العملاء المحتملون' },
  { href: '/site', label: 'محرر الموقع' },
  { href: '/site/preview', label: 'معاينة الموقع' },
  { href: '/team', label: 'الفريق' },
  { href: '/settings', label: 'الإعدادات' },
  { href: '/billing', label: 'الفوترة والاشتراك' },
];
