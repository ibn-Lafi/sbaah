import type { Locale } from '@/lib/i18n/locales';
import { listMapPins } from '@/lib/api/public-map';
import { listCities } from '@/lib/api/reference-data';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import { MapViewClient } from './map-view-client';

interface MapSectionProps {
  locale: Locale;
  variant?: 'default' | 'lavender';
}

/**
 * "الخريطة" home section (migration 0044) — data-driven, not
 * theme-branched (same reasoning as `BrokerMarketerForm`: a real
 * interactive widget, not authorable copy), so unlike `PropertyGridSection`
 * it's imported directly in `[locale]/page.tsx` rather than through the
 * theme registry. No config prop, same as `BrokerMarketerForm`: its
 * `MapSectionConfig` has no editable fields (toggle/reorder only).
 * Renders nothing when the tenant has no property/project/building with
 * a location set yet — expected for most tenants today, since `lat`/`lng`
 * are brand-new optional fields.
 *
 * The actual map (`MapView`, ~200KB+ via maplibre-gl) is loaded through
 * `MapViewClient`'s `next/dynamic(..., { ssr: false })` — this section is
 * hidden by default for every tenant (migration 0044 seeds it
 * `is_visible: false`), so most home pages must never ship that bundle
 * just because the section type exists in the enum.
 */
export async function MapSection({ locale, variant = 'default' }: MapSectionProps) {
  const [pins, cities] = await Promise.all([listMapPins(), listCities()]);

  if (pins.properties.length === 0 && pins.projects.length === 0 && pins.buildings.length === 0) {
    return null;
  }

  const title = DEFAULT_SECTION_TITLE.map[locale];

  const lavender = variant === 'lavender';
  return (
    <section
      className={
        lavender ? 'bg-[#f4f1ea] px-5 py-16 sm:px-6 sm:py-24' : 'mx-auto max-w-6xl px-6 py-12'
      }
    >
      <div className={lavender ? 'mx-auto max-w-7xl' : ''}>
        {lavender && (
          <p className="text-tenant-primary mb-3 text-xs font-semibold">
            {locale === 'ar' ? 'مواقعنا' : 'OUR LOCATIONS'}
          </p>
        )}
        <h2
          className={
            lavender
              ? 'mb-8 border-b border-black/20 pb-5 text-3xl font-semibold sm:text-5xl'
              : 'mb-6 text-2xl font-bold'
          }
        >
          {title}
        </h2>
        <div
          className={
            lavender
              ? 'overflow-hidden border border-black/20 bg-white'
              : 'overflow-hidden rounded-2xl border border-black/10'
          }
        >
          <MapViewClient locale={locale} cities={cities} pins={pins} />
        </div>
      </div>
    </section>
  );
}
