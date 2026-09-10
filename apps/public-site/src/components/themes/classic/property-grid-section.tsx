import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { PropertyGridSectionProps } from '../types';

const SEE_ALL_LABEL: Record<Locale, string> = { ar: 'عرض كل العقارات', en: 'See all properties' };
const EMPTY_LABEL: Record<Locale, string> = { ar: 'لا توجد عقارات منشورة بعد', en: 'No published properties yet' };

const FEATURED_COUNT = 6;

export async function PropertyGridSection({ locale, config }: PropertyGridSectionProps) {
  const title = pickLocalized(locale, config.title_ar || DEFAULT_SECTION_TITLE.property_grid.ar, config.title_en ?? null) || DEFAULT_SECTION_TITLE.property_grid[locale];
  const propertiesHref = locale === 'ar' ? '/properties' : '/en/properties';

  const [cities, { properties }] = await Promise.all([listCities(), listPublicProperties({ page: 1 })]);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const featured = properties.slice(0, FEATURED_COUNT);

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={propertiesHref} className="text-sm font-semibold text-tenant-primary hover:underline">
          {SEE_ALL_LABEL[locale]}
        </Link>
      </div>

      {featured.length === 0 ? (
        <p className="text-black/60">{EMPTY_LABEL[locale]}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} city={citiesById.get(property.city_id)} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
