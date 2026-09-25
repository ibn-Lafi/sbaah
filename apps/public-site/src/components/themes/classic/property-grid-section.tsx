import type { Locale } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { PropertyGridSectionProps } from '../types';
import { ClassicEmptyState, ClassicSection, ClassicSectionHeading } from './primitives';

const SEE_ALL_LABEL: Record<Locale, string> = { ar: 'عرض كل العقارات', en: 'See all properties' };
const EMPTY_LABEL: Record<Locale, string> = { ar: 'لا توجد عقارات منشورة بعد', en: 'No published properties yet' };

const FEATURED_COUNT = 6;

// لا نموذج ثنائي اللغة للعنوان (الثيم الأساسي بلغة عربية واحدة فقط، طلب المؤسس).
export async function PropertyGridSection({ locale, config }: PropertyGridSectionProps) {
  const title = config.title_ar || DEFAULT_SECTION_TITLE.property_grid.ar;
  const propertiesHref = locale === 'ar' ? '/properties' : '/en/properties';

  const [cities, { properties }] = await Promise.all([listCities(), listPublicProperties({ page: 1 })]);
  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const featured = properties.slice(0, FEATURED_COUNT);

  return (
    <ClassicSection>
      <ClassicSectionHeading
        title={title}
        action={
          <a href={propertiesHref} className="shrink-0 text-sm font-semibold text-tenant-primary hover:underline">
            {SEE_ALL_LABEL[locale]}
          </a>
        }
      />

      {featured.length === 0 ? (
        <ClassicEmptyState>{EMPTY_LABEL[locale]}</ClassicEmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} city={property.city_id ? citiesById.get(property.city_id) : undefined} locale={locale} />
          ))}
        </div>
      )}
    </ClassicSection>
  );
}
