import { notFound } from 'next/navigation';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getPublicProperty } from '@/lib/api/public-properties';
import { getTenantSite } from '@/lib/tenant/get-tenant-site';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { PropertyGallery } from '@/components/properties/property-gallery';
import { WhatsappButton } from '@/components/properties/whatsapp-button';
import { InquiryForm } from '@/components/properties/inquiry-form';

const LABELS = {
  ar: { area: 'المساحة', bedrooms: 'الغرف', bathrooms: 'دورات المياه', description: 'الوصف' },
  en: { area: 'Area', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms', description: 'Description' },
};

/** Western digits even on the Arabic page — matches `dashboard`'s established convention, not ar-SA's Arabic-Indic digits. */
function formatPrice(locale: 'ar' | 'en', price: number): string {
  const amount = price.toLocaleString('en-US');
  return locale === 'ar' ? `${amount} ر.س` : `SAR ${amount}`;
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = LABELS[locale];

  const [property, site] = await Promise.all([getPublicProperty(id), getTenantSite()]);
  if (!property || !site) {
    notFound();
  }

  const [cities, districts] = await Promise.all([listCities(), listDistricts(property.city_id)]);
  const city = cities.find((c) => c.id === property.city_id);
  const district = districts.find((d) => d.id === property.district_id);

  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const description = pickLocalized(locale, property.description_ar, property.description_en);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
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

        <div className="flex flex-col gap-4">
          <WhatsappButton
            locale={locale}
            phone={site.whatsapp_phone}
            title={title}
            tenantId={property.tenant_id}
            propertyId={property.id}
          />
          <InquiryForm locale={locale} tenantId={property.tenant_id} propertyId={property.id} />
        </div>
      </div>
    </div>
  );
}
