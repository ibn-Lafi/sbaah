import type { Locale } from './locales';

/**
 * Kept flat and minimal on purpose — only the chrome strings this task's
 * scaffold (header language toggle, placeholder homepage) actually
 * needs. The "site not found" page is locale-neutral by necessity (see
 * app/not-found.tsx) and doesn't use this dictionary. Property/section
 * page content is data-driven (title_ar/title_en columns, per-section
 * `config` JSON) and gets its own dictionary entries as those pages are
 * built (tasks 33-35/42), not pre-declared here speculatively.
 */
const dictionaries = {
  ar: {
    languageSwitch: 'English',
    comingSoon: 'قريبًا',
  },
  en: {
    languageSwitch: 'العربية',
    comingSoon: 'Coming soon',
  },
} satisfies Record<Locale, Record<string, string>>;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
