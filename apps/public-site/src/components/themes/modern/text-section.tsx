import type { TextSectionProps } from '../types';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';

/**
 * Modern theme's About/Why-us — a two-column editorial layout (title +
 * accent bar in one column, body text in the other) on `md`+, stacked on
 * mobile/tablet, unlike Classic's single centered column.
 */
export function TextSection({ type, locale, config }: TextSectionProps) {
  const body = pickLocalized(locale, config.body_ar ?? '', config.body_en ?? null);
  if (!body) return null;

  const title = pickLocalized(locale, config.title_ar || DEFAULT_SECTION_TITLE[type].ar, config.title_en ?? null) || DEFAULT_SECTION_TITLE[type][locale];

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr] md:gap-12">
        <div>
          <div className="mb-3 h-1.5 w-12 rounded-full bg-tenant-primary" />
          <h2 className="text-2xl font-extrabold">{title}</h2>
        </div>
        <p className="whitespace-pre-line text-lg leading-relaxed text-black/70">{body}</p>
      </div>
    </section>
  );
}
