import type { Locale } from '@/lib/i18n/locales';
import type { WebsiteSectionType } from '@sbaah/shared';

/** Shown when the section's own `config.title_*` is empty (true for every section on every account today — task 28/42 never built the editor until now, task 35/42). */
export const DEFAULT_SECTION_TITLE: Record<WebsiteSectionType, Record<Locale, string>> = {
  hero: { ar: '', en: '' },
  property_grid: { ar: 'أحدث العقارات', en: 'Latest Properties' },
  project_grid: { ar: 'مشاريعنا', en: 'Our Projects' },
  property_detail: { ar: '', en: '' },
  about: { ar: 'من نحن', en: 'About Us' },
  why_us: { ar: 'لماذا نحن', en: 'Why Choose Us' },
  contact: { ar: 'تواصل معنا', en: 'Contact Us' },
  footer: { ar: '', en: '' },
};
