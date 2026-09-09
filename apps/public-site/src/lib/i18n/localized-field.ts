import type { Locale } from './locales';

/** Every bilingual data column follows the same `_ar`/`_en` naming (properties.title_ar/title_en, cities.name_ar/name_en, ...) — one small helper instead of a locale ? a : b ternary at every call site. */
export function pickLocalized(locale: Locale, ar: string, en: string | null): string {
  if (locale === 'en') return en || ar;
  return ar;
}
