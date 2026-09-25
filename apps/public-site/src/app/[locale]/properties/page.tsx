import type { AssetType, ListingType } from '@sbaah/shared';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { listPublicProperties } from '@/lib/api/public-properties';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { PropertyCard } from '@/components/properties/property-card';
import { PropertyFilters, type PropertyFiltersValue } from '@/components/properties/property-filters';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderProperty } from '@/components/themes/lavender/cards';
import { LavenderPropertyFilters } from '@/components/themes/lavender/property-filters';
import { renderThemedSection } from '@/lib/website/render-section';

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
  };
  const before = site.sections.filter((s) => s.type !== 'property_grid' && (!gridSection || s.order_index < gridSection.order_index));
  const after = site.sections.filter((s) => s.type !== 'property_grid' && gridSection && s.order_index > gridSection.order_index);

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

      {gridSection && (
        <div className={isLavender ? "bg-[#f4f1ea] px-5 py-16 sm:px-6 sm:py-24" : "mx-auto max-w-6xl px-6 py-8"}>
          <div className={isLavender ? "mx-auto max-w-7xl" : ""}>
          <h1 className={isLavender ? "mb-10 border-b border-black/20 pb-6 text-4xl font-medium sm:text-6xl" : "mb-6 text-2xl font-bold"}>{t.title}</h1>

          <div className="mb-8">
            {isLavender ? <LavenderPropertyFilters locale={locale} cities={cities} districts={districts} value={filters} /> : <PropertyFilters locale={locale} cities={cities} districts={districts} value={filters} />}
          </div>

          {listResult.properties.length === 0 ? (
            <p className="text-black/60">{t.noResults}</p>
          ) : (
            <div className={isLavender ? "grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
              {listResult.properties.map((property) => isLavender ? <LavenderProperty key={property.id} property={property} city={property.city_id ? citiesById.get(property.city_id) : undefined} locale={locale}/> : <PropertyCard key={property.id} property={property} city={property.city_id ? citiesById.get(property.city_id) : undefined} locale={locale} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
              {page > 1 && <a href={pageHref(page - 1)}>{t.prev}</a>}
              <span className="text-black/60">
                {t.page} {page} / {totalPages}
              </span>
              {page < totalPages && <a href={pageHref(page + 1)}>{t.next}</a>}
            </nav>
          )}
          </div>
        </div>
      )}

      {after.map((s) => renderThemedSection(s, theme, themedCtx))}
    </div>
  );
}
