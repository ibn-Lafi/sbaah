import type { AssetType, ListingType } from '@sbaah/shared';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import {
  PropertyFilters,
  type PropertyFiltersValue,
} from '@/components/properties/property-filters';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderProperty } from '@/components/themes/lavender/cards';
import { LavenderPropertyFilters } from '@/components/themes/lavender/property-filters';
import { renderThemedSection } from '@/lib/website/render-section';

const PAGE_LABELS = {
  ar: {
    eyebrow: 'الفرص العقارية',
    title: 'العقارات',
    subtitle: 'ابحث في العقارات المتاحة للبيع والإيجار وصفّ النتائج بحسب احتياجك.',
    noResults: 'لا توجد عقارات مطابقة',
    prev: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    count: 'عقار',
  },
  en: {
    eyebrow: 'Property opportunities',
    title: 'Properties',
    subtitle:
      'Browse properties available for sale and rent, then refine the results around your needs.',
    noResults: 'No matching properties',
    prev: 'Previous',
    next: 'Next',
    page: 'Page',
    count: 'properties',
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The "العقارات" page (متجر الثيمات follow-up, migration 0024) — this
 * page's `website_pages`/`website_sections` rows let a tenant add/reorder
 * themed sections (a hero banner, an about blurb, contact) around the
 * actual listing. The listing itself (filters + grid + pagination) is
 * the `property_grid`-type section's fixed anchor: it is NOT theme-
 * branched (unlike home's featured grid) and keeps its existing,
 * unchanged behavior — a tenant can toggle it and move it up/down among
 * the other sections, but not restyle it per-theme in this version.
 */
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

  const [site, cities, districts, listResult] = await Promise.all([
    getTenantSitePage('properties'),
    listCities(),
    filters.city_id ? listDistricts(filters.city_id) : Promise.resolve([]),
    listPublicProperties({
      city_id: filters.city_id,
      district_id: filters.district_id,
      property_type: filters.property_type as AssetType | undefined,
      listing_type: filters.listing_type as ListingType | undefined,
      min_price: filters.min_price ? Number(filters.min_price) : undefined,
      max_price: filters.max_price ? Number(filters.max_price) : undefined,
      bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
      page,
    }),
  ]);
  if (!site) return null; // layout.tsx already calls notFound()/renders suspended in this case

  const citiesById = new Map(cities.map((city) => [city.id, city]));
  const totalPages = Math.max(1, Math.ceil(listResult.total / listResult.page_size));
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const resolvedTheme = resolveTheme(site.website.theme_key);
  const theme = resolvedTheme.components;
  const isLavender = resolvedTheme.key === 'lavender';

  const gridSection = site.sections.find((s) => s.type === 'property_grid');
  const themedCtx = {
    locale,
    bannerUrl: site.website.banner_image_url,
    bannerVideoUrl: site.website.banner_video_url,
    tenantName,
    whatsappPhone: site.whatsapp_phone,
    tenantId: site.tenant.id,
    themeKey: resolvedTheme.key,
  };
  const before = site.sections.filter(
    (s) => s.type !== 'property_grid' && (!gridSection || s.order_index < gridSection.order_index),
  );
  const after = site.sections.filter(
    (s) => s.type !== 'property_grid' && gridSection && s.order_index > gridSection.order_index,
  );
  const hasPageHero = before.some((section) => section.type === 'hero');

  function pageHref(targetPage: number): string {
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val) query.set(key, val);
    }
    query.set('page', String(targetPage));
    return `?${query.toString()}`;
  }

  return (
    <div>
      {before.map((s) => renderThemedSection(s, theme, themedCtx))}

      {isLavender && !hasPageHero && (
        <section
          className={`bg-[#171713] px-5 pb-14 pt-16 text-white sm:px-6 sm:pb-20 sm:pt-24 ${before.length === 0 ? '-mt-24 pt-36 sm:pt-40' : ''}`}
        >
          <div className="mx-auto max-w-7xl border-t border-white/25 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-white/50">
              {t.eyebrow}
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
              <h1 className="max-w-4xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                {t.title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/60 sm:text-base">{t.subtitle}</p>
            </div>
          </div>
        </section>
      )}

      {gridSection && (
        <div
          className={
            isLavender ? 'bg-[#f4f1ea] px-5 py-14 sm:px-6 sm:py-20' : 'mx-auto max-w-6xl px-6 py-8'
          }
        >
          <div className={isLavender ? 'mx-auto max-w-7xl' : ''}>
            {isLavender ? (
              <div className="mb-8 flex items-end justify-between gap-5 border-b border-black/15 pb-5">
                <h2 className="text-2xl font-medium sm:text-4xl">{t.title}</h2>
                <span className="whitespace-nowrap text-xs text-black/45">
                  {listResult.total} {t.count}
                </span>
              </div>
            ) : (
              <h1 className="mb-6 text-2xl font-bold">{t.title}</h1>
            )}

            <div className="mb-8">
              {isLavender ? (
                <LavenderPropertyFilters
                  locale={locale}
                  cities={cities}
                  districts={districts}
                  value={filters}
                />
              ) : (
                <PropertyFilters
                  locale={locale}
                  cities={cities}
                  districts={districts}
                  value={filters}
                />
              )}
            </div>

            {listResult.properties.length === 0 ? (
              <div
                className={
                  isLavender
                    ? 'border-y border-black/15 py-16 text-center text-sm text-black/55'
                    : 'text-black/60'
                }
              >
                {t.noResults}
              </div>
            ) : (
              <div
                className={
                  isLavender
                    ? 'grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'
                }
              >
                {listResult.properties.map((property) =>
                  isLavender ? (
                    <LavenderProperty
                      key={property.id}
                      property={property}
                      city={property.city_id ? citiesById.get(property.city_id) : undefined}
                      locale={locale}
                    />
                  ) : (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      city={property.city_id ? citiesById.get(property.city_id) : undefined}
                      locale={locale}
                    />
                  ),
                )}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className={
                  isLavender
                    ? 'mt-12 flex items-center justify-between border-t border-black/15 pt-5 text-sm'
                    : 'mt-8 flex items-center justify-center gap-4 text-sm'
                }
              >
                <span>
                  {page > 1 && (
                    <a
                      className={isLavender ? 'border-b border-black/40 pb-1' : ''}
                      href={pageHref(page - 1)}
                    >
                      {t.prev}
                    </a>
                  )}
                </span>
                <span className="text-black/60">
                  {t.page} {page} / {totalPages}
                </span>
                <span>
                  {page < totalPages && (
                    <a
                      className={isLavender ? 'border-b border-black/40 pb-1' : ''}
                      href={pageHref(page + 1)}
                    >
                      {t.next}
                    </a>
                  )}
                </span>
              </nav>
            )}
          </div>
        </div>
      )}

      {after.map((s) => renderThemedSection(s, theme, themedCtx))}
    </div>
  );
}
