import Link from 'next/link';
import type { ListingType, PropertyType } from '@sbaah/shared';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { PropertyFilters, type PropertyFiltersValue } from '@/components/properties/property-filters';

const PAGE_LABELS = {
  ar: { title: 'العقارات', noResults: 'لا توجد عقارات مطابقة', prev: 'السابق', next: 'التالي', page: 'صفحة' },
  en: { title: 'Properties', noResults: 'No matching properties', prev: 'Previous', next: 'Next', page: 'Page' },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertiesPage({ params, searchParams }: PageProps) {
  const { locale: rawLocale } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const sp = await searchParams;
  const t = PAGE_LABELS[locale];

  const filters: PropertyFiltersValue = {
    city_id: first(sp.city_id),
    district_id: first(sp.district_id),
    property_type: first(sp.property_type),
    listing_type: first(sp.listing_type),
    min_price: first(sp.min_price),
    max_price: first(sp.max_price),
    bedrooms: first(sp.bedrooms),
  };
  const page = Number(first(sp.page)) || 1;

  const [cities, districts, listResult] = await Promise.all([
    listCities(),
    filters.city_id ? listDistricts(filters.city_id) : Promise.resolve([]),
    listPublicProperties({
      city_id: filters.city_id,
      district_id: filters.district_id,
      property_type: filters.property_type as PropertyType | undefined,
      listing_type: filters.listing_type as ListingType | undefined,
      min_price: filters.min_price ? Number(filters.min_price) : undefined,
      max_price: filters.max_price ? Number(filters.max_price) : undefined,
      bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
      page,
    }),
  ]);

  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const totalPages = Math.max(1, Math.ceil(listResult.total / listResult.page_size));

  function pageHref(targetPage: number): string {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val) query.set(key, val);
    }
    query.set('page', String(targetPage));
    return `?${query.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t.title}</h1>

      <div className="mb-8">
        <PropertyFilters locale={locale} cities={cities} districts={districts} value={filters} />
      </div>

      {listResult.properties.length === 0 ? (
        <p className="text-black/60">{t.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listResult.properties.map((property) => (
            <PropertyCard key={property.id} property={property} city={citiesById.get(property.city_id)} locale={locale} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)}>{t.prev}</Link>}
          <span className="text-black/60">
            {t.page} {page} / {totalPages}
          </span>
          {page < totalPages && <Link href={pageHref(page + 1)}>{t.next}</Link>}
        </nav>
      )}
    </div>
  );
}
