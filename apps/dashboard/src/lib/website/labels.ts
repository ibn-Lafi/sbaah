import type { WebsiteSectionType } from '@sbaah/shared';

/** PRODUCT_SPEC.md section 6 — the fixed section-block library, in the order they're seeded by default (migration 0012). */
export const SECTION_TYPE_LABELS: Record<WebsiteSectionType, string> = {
  hero: 'الغلاف الرئيسي (Hero)',
  property_grid: 'شبكة العقارات',
  about: 'من نحن',
  why_us: 'لماذا نحن',
  contact: 'تواصل',
  footer: 'التذييل (Footer)',
};
