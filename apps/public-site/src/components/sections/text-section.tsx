import type { AboutSectionConfig } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';

interface TextSectionProps {
  type: 'about' | 'why_us';
  locale: Locale;
  config: AboutSectionConfig;
}

/**
 * Used for both `about` and `why_us` (same config shape). Unlike Hero's
 * fallback-to-tenant-name, there's no data anywhere to fall back to for
 * freeform body text — a section toggled on with no authored body
 * (true for every existing account before this task's editor existed)
 * renders nothing at all rather than generic filler copy, which would
 * make every tenant's site look identically templated.
 */
export function TextSection({ type, locale, config }: TextSectionProps) {
  const body = pickLocalized(locale, config.body_ar ?? '', config.body_en ?? null);
  if (!body) return null;

  const title = pickLocalized(locale, config.title_ar || DEFAULT_SECTION_TITLE[type].ar, config.title_en ?? null) || DEFAULT_SECTION_TITLE[type][locale];

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 text-center">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <p className="whitespace-pre-line text-black/70">{body}</p>
    </section>
  );
}
