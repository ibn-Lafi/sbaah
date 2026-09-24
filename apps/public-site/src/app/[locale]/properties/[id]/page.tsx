import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getPublicProperty } from '@/lib/api/public-properties';
import { getTenantSitePage } from '@/lib/tenant/get-tenant-site';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { PropertyGallery } from '@/components/properties/property-gallery';
import { resolveTheme } from '@/components/themes/registry';
import { LavenderPropertyDetail } from '@/components/themes/lavender/property-detail';
import { renderThemedSection } from '@/lib/website/render-section';
import { buildLocalizedAlternates, localizedPath, getPublicOrigin } from '@/lib/routing/public-url';

const LABELS = {
  ar: { area: 'المساحة', bedrooms: 'الغرف', bathrooms: 'دورات المياه', description: 'الوصف' },
  en: { area: 'Area', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', description: 'Description' },
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const property = await getPublicProperty(id);
  if (!property) {
    return { robots: { index: false, follow: false } };
  }

  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const description = pickLocalized(locale, property.description_ar, property.description_en) || undefined;
  const pathname = `/properties/${property.slug ?? property.id}`;
  const [alternates, origin] = await Promise.all([
    buildLocalizedAlternates(locale, pathname),
    getPublicOrigin(),
  ]);
  const url = origin ? `${origin}${localizedPath(locale, pathname)}` : undefined;
  const image = property.property_media.find((media) => media.media_type === 'image')?.url;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_SA',
      url,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/**
 * "تفاصيل العقار" page (متجر الثيمات follow-up, migration 0024) — same
 * pattern as `/properties`: this page's sections let a tenant add a hero
 * banner around the property's own detail view, but the detail view
 * itself (`property_detail`-type anchor) keeps its existing, unthemed
 * layout — see that page's own comment for why. `contact`-type sections
 * are filtered out unconditionally (founder's explicit call — the inline
 * InquiryForm below is already property-specific contact, and the footer
 * covers the tenant's general contact info). No WhatsApp button anywhere
 * on this site anymore (founder's explicit call, removed across the theme
 * — see contact-section.tsx's comment).
 */
export default async function PropertyDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = LABELS[locale];

  const [property, site] = await Promise.all([getPublicProperty(id), getTenantSitePage('property_detail')]);
  if (!property || !site) {
    notFound();
  }
  if (property.slug && id !== property.slug) {
    permanentRedirect(localizedPath(locale, `/properties/${property.slug}`));
  }

  const [cities, districts] = await Promise.all([listCities(), listDistricts(property.city_id ?? undefined)]);
  const city = cities.find((c) => c.id === property.city_id);
  const district = districts.find((d) => d.id === property.district_id);

  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const description = pickLocalized(locale, property.description_ar, property.description_en);
  const tenantName = locale === 'ar' ? site.tenant.name_ar : site.tenant.name_en;
  const resolvedTheme = resolveTheme(site.website.theme_key);
  const theme = resolvedTheme.components;
  const isLavender = resolvedTheme.key === 'lavender';
  const themedCtx = {
    locale,
    bannerUrl: site.website.banner_image_url,
    bannerVideoUrl: site.website.banner_video_url,
    tenantName,
    whatsappPhone: site.whatsapp_phone,
    tenantId: site.tenant.id,
    assetId: property.asset_id,
    listingId: property.id,
    cities,
  };

  // 'contact' excluded outright (founder's explicit call, matching the home
  // page): the inline WhatsappButton + InquiryForm below already covers
  // property-specific contact, and the footer carries the tenant's general
  // phone/WhatsApp/address — a second generic "تواصل معنا" block here was
  // redundant. A `contact` row may still exist in this page's seeded
  // sections; it's intentionally never rendered regardless of visibility.
  const detailSection = site.sections.find((s) => s.type === 'property_detail');
  const before = site.sections.filter(
    (s) => s.type !== 'property_detail' && s.type !== 'contact' && (!detailSection || s.order_index < detailSection.order_index),
  );
  const after = site.sections.filter(
    (s) => s.type !== 'property_detail' && s.type !== 'contact' && detailSection && s.order_index > detailSection.order_index,
  );

  return (
    <div>
      {before.map((s) => renderThemedSection(s, theme, themedCtx))}

      {detailSection && (isLavender ? <LavenderPropertyDetail locale={locale} property={property} city={city} district={district}/> :
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="flex flex-col gap-6">
              <PropertyGallery media={property.property_media} title={title} />

              <div>
                <span className="text-sm font-medium text-tenant-primary">{getListingTypeLabel(locale, property.listing_type)}</span>
                <h1 className="mt-1 text-2xl font-bold">{title}</h1>
                <p className="mt-1 text-black/60">
                  {getPropertyTypeLabel(locale, property.property_type)}
                  {city ? ` · ${pickLocalized(locale, city.name_ar, city.name_en)}` : ''}
                  {district ? ` · ${pickLocalized(locale, district.name_ar, district.name_en)}` : ''}
                </p>
                <p className="mt-3 text-2xl font-bold text-tenant-primary">{formatPrice(locale, property.price)}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl border border-black/10 p-4 text-center text-sm">
                <div>
                  <p className="text-black/60">{t.area}</p>
                  <p className="font-semibold">{property.area_sqm} m²</p>
                </div>
                <div>
                  <p className="text-black/60">{t.bedrooms}</p>
                  <p className="font-semibold">{property.bedrooms ?? '—'}</p>
                </div>
                <div>
                  <p className="text-black/60">{t.bathrooms}</p>
                  <p className="font-semibold">{property.bathrooms ?? '—'}</p>
                </div>
              </div>

              {description && (
                <div>
                  <h2 className="mb-2 font-semibold">{t.description}</h2>
                  <p className="whitespace-pre-line text-black/80">{description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {after.map((s) => renderThemedSection(s, theme, themedCtx))}
    </div>
  );
}
