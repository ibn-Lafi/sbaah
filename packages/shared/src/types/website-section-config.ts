import type { WebsiteSectionType } from './enums';

/**
 * `website_sections.config` (jsonb) has no fixed shape at the DB/API
 * layer (task 28/42 deliberately left it a free-form record, pending
 * "a separate decision about fields per section type" — this is that
 * decision, made for task 35/42 since public-site now actually needs to
 * render real content per section). Every field is optional and every
 * reader must fall back gracefully: nothing has ever written to these
 * columns before this task, so `config` is `{}` for every section on
 * every existing account.
 */
export interface HeroSectionConfig {
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
}

export interface PropertyGridSectionConfig {
  title_ar?: string;
  title_en?: string;
}

/** Also used for `why_us` — same shape (title + one body of text), not a separate multi-item feature-list editor (kept deliberately simple). */
export interface AboutSectionConfig {
  title_ar?: string;
  title_en?: string;
  body_ar?: string;
  body_en?: string;
}

export interface ContactSectionConfig {
  title_ar?: string;
  title_en?: string;
}

/** No editable fields — the footer's only content is the tenant name (auto) and the mandatory سبعة badge (fixed, never from config). */
export type FooterSectionConfig = Record<string, never>;

export type WebsiteSectionConfigByType = {
  hero: HeroSectionConfig;
  property_grid: PropertyGridSectionConfig;
  about: AboutSectionConfig;
  why_us: AboutSectionConfig;
  contact: ContactSectionConfig;
  footer: FooterSectionConfig;
};

export function getSectionConfig<T extends WebsiteSectionType>(
  type: T,
  config: Record<string, unknown>,
): WebsiteSectionConfigByType[T] {
  return config as WebsiteSectionConfigByType[T];
}
