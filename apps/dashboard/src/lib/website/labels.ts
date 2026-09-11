import type { WebsitePageKey, WebsiteSectionType } from '@sbaah/shared';

/** PRODUCT_SPEC.md section 6 — the fixed section-block library, in the order they're seeded by default (migration 0012/0024). */
export const SECTION_TYPE_LABELS: Record<WebsiteSectionType, string> = {
  hero: 'الغلاف الرئيسي (Hero)',
  property_grid: 'شبكة العقارات',
  project_grid: 'شبكة المشاريع',
  property_detail: 'محتوى تفاصيل العقار',
  about: 'من نحن',
  why_us: 'لماذا نحن',
  contact: 'تواصل',
  broker_marketer_form: 'نموذج الوسطاء والمسوقين',
  footer: 'التذييل (Footer)',
};

/** متجر الثيمات follow-up (migration 0024) — the fixed page tabs in محرر الموقع. */
export const WEBSITE_PAGE_LABELS: Record<WebsitePageKey, string> = {
  home: 'الرئيسية',
  properties: 'العقارات',
  property_detail: 'تفاصيل العقار',
  projects: 'المشاريع',
  about: 'من نحن',
  contact: 'تواصل معنا',
};

/** Public path for each page — used to build the device-preview iframe's URL. */
export const WEBSITE_PAGE_PATHS: Record<WebsitePageKey, string> = {
  home: '/',
  properties: '/properties',
  property_detail: '/properties',
  projects: '/projects',
  about: '/about',
  contact: '/contact',
};
