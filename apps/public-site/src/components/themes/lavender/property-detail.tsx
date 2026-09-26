import type { Locale } from '@/lib/i18n/locales';
import type { PublicPropertyDetail } from '@/lib/api/public-properties';
import type { City, District } from '@sbaah/shared';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { InquiryForm } from '@/components/properties/inquiry-form';

export function LavenderPropertyDetail({
  locale,
  property,
  city,
  district,
  tenantId,
}: {
  locale: Locale;
  property: PublicPropertyDetail;
  city?: City;
  district?: District;
  tenantId: string;
}) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const desc = pickLocalized(locale, property.description_ar, property.description_en);
  const images = property.property_media
    .filter((m) => m.media_type === 'image')
    .sort((a, b) => a.order_index - b.order_index);
  const primary = images[0];
  const location = [
    district && pickLocalized(locale, district.name_ar, district.name_en),
    city && pickLocalized(locale, city.name_ar, city.name_en),
  ]
    .filter(Boolean)
    .join('، ');
  const facts = [
    [
      locale === 'ar' ? 'نوع العقار' : 'Property type',
      getPropertyTypeLabel(locale, property.property_type),
    ],
    [locale === 'ar' ? 'المساحة' : 'Area', property.area_sqm ? `${property.area_sqm} م²` : '—'],
    [locale === 'ar' ? 'غرف النوم' : 'Bedrooms', property.bedrooms ?? '—'],
    [locale === 'ar' ? 'دورات المياه' : 'Bathrooms', property.bathrooms ?? '—'],
    [locale === 'ar' ? 'الموقع' : 'Location', location || '—'],
    [locale === 'ar' ? 'الرقم المرجعي' : 'Reference', property.listing_number || '—'],
  ];
  return (
    <article className="bg-[var(--tenant-background)] text-[#171713]">
      <header className="px-5 pb-10 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-tenant-primary mb-4 text-xs font-semibold tracking-[.12em]">
                {property.listing_type ? getListingTypeLabel(locale, property.listing_type) : (locale === 'ar' ? 'عقار' : 'Property')}
                {location ? ` · ${location}` : ''}
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.1] sm:text-6xl">
                {title}
              </h1>
            </div>
            <div className="lg:text-end">
              <p className="text-xs font-medium text-black/60">
                {locale === 'ar' ? 'السعر' : 'Price'}
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {property.price != null ? formatPrice(locale, property.price) : (locale === 'ar' ? 'السعر عند الطلب' : 'Price on request')}
              </p>
            </div>
          </div>
        </div>
      </header>
      {primary && (
        <section
          aria-label={locale === 'ar' ? 'صور العقار' : 'Property gallery'}
          className="px-5 pb-12 sm:px-6 sm:pb-20"
        >
          <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-12">
            {images.slice(0, 5).map((media, index) => (
              <img
                key={media.id ?? media.url}
                src={media.url}
                alt={`${title} ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                className={`${index === 0 ? 'aspect-[16/10] sm:col-span-8 sm:row-span-2' : 'aspect-[4/3] sm:col-span-4'} h-full w-full object-cover`}
              />
            ))}
          </div>
        </section>
      )}
      <section className="bg-white px-5 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.65fr_1.35fr] lg:gap-16">
          <div>
            <p className="text-tenant-primary mb-4 text-xs font-semibold">
              {locale === 'ar' ? 'بيانات العقار' : 'PROPERTY PROFILE'}
            </p>
            <h2 className="text-3xl font-semibold sm:text-5xl">
              {locale === 'ar' ? 'تفاصيل العقار' : 'Property details'}
            </h2>
          </div>
          <div>
            <dl className="grid grid-cols-2 border-t border-black/25 sm:grid-cols-3">
              {facts.map(([key, value]) => (
                <div key={String(key)} className="border-b border-black/20 py-5 pe-3">
                  <dt className="text-xs font-medium text-black/60">{key}</dt>
                  <dd className="mt-2 text-base font-semibold sm:text-lg">{value}</dd>
                </div>
              ))}
            </dl>
            {desc && (
              <div className="mt-12 border-t border-black/20 pt-7">
                <h3 className="mb-4 text-xl font-semibold">
                  {locale === 'ar' ? 'عن العقار' : 'About the property'}
                </h3>
                <p className="max-w-3xl whitespace-pre-line text-base leading-8 text-black/70">
                  {desc}
                </p>
              </div>
            )}
            <a
              href="#inquiry"
              className="bg-tenant-primary focus-visible:ring-tenant-primary mt-10 inline-flex min-h-12 items-center px-7 text-sm font-bold text-white outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              {locale === 'ar' ? 'سجل اهتمامك' : 'Register your interest'}
              <span aria-hidden="true" className="ms-3">
                {locale === 'ar' ? '←' : '→'}
              </span>
            </a>
          </div>
        </div>
      </section>
      <section id="inquiry" className="px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-xl">
          <InquiryForm
            locale={locale}
            tenantId={tenantId}
            listingId={property.id}
            variant="lavender"
            eyebrow={locale === 'ar' ? 'مهتم بالعقار؟' : 'INTERESTED IN THIS PROPERTY?'}
            description={locale === 'ar' ? 'اترك بياناتك وسيتواصل معك الفريق بخصوص العقار.' : 'Leave your details and the team will contact you about this property.'}
          />
        </div>
      </section>
    </article>
  );
}
