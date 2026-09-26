import type { Locale } from '@/lib/i18n/locales';
import type { City } from '@sbaah/shared';
import type { PublicProperty } from '@/lib/api/public-properties';
import type { PublicProject } from '@/lib/api/public-projects';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { formatPrice, getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import { localizedPath } from '@/lib/routing/public-url';

function propertyImage(property: PublicProperty) {
  return [...property.property_media]
    .filter((media) => media.media_type === 'image')
    .sort((a, b) => a.order_index - b.order_index)[0]?.url;
}

const arrow = (locale: Locale) => (locale === 'ar' ? '←' : '→');

export function LavenderProperty({
  property,
  city,
  locale,
  featured = false,
  card = false,
}: {
  property: PublicProperty;
  city?: City;
  locale: Locale;
  featured?: boolean;
  card?: boolean;
}) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const image = propertyImage(property);
  if (card) {
    return (
      <a
        href={localizedPath(locale, `/properties/${property.slug ?? property.id}`)}
        className="focus-visible:ring-tenant-primary group block w-[68vw] max-w-[285px] shrink-0 snap-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_32px_rgba(23,23,19,.08)] outline-none focus-visible:ring-2 focus-visible:ring-offset-4 sm:w-[300px] sm:max-w-[300px] lg:w-[320px] lg:max-w-[320px]"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#e7e4dc]">
          {image ? (
            <img src={image} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025] motion-reduce:transition-none" />
          ) : (
            <div className="flex h-full items-end bg-gradient-to-br from-[#ddd8cc] to-[#c9c3b5] p-4 text-xs font-semibold text-black/60">
              {locale === 'ar' ? 'صورة العقار غير متاحة' : 'Property image unavailable'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#171713] backdrop-blur">
            {getListingTypeLabel(locale, property.listing_type)}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
            <h3 className="text-lg font-semibold leading-tight sm:text-xl">{title}</h3>
            {city && <p className="mt-1.5 text-xs text-white/80 sm:text-sm">{pickLocalized(locale, city.name_ar, city.name_en)}</p>}
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-white/25 pt-3 text-xs">
              <span className="text-white/80">{getPropertyTypeLabel(locale, property.property_type)}{property.area_sqm ? ` · ${property.area_sqm} م²` : ''}</span>
              <span className="whitespace-nowrap font-semibold">{formatPrice(locale, property.price)}</span>
            </div>
          </div>
        </div>
      </a>
    );
  }
  return (
    <a
      href={localizedPath(locale, `/properties/${property.slug ?? property.id}`)}
      className={`focus-visible:ring-tenant-primary group block outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${featured ? 'sm:col-span-2' : ''}`}
    >
      <div
        className={`relative overflow-hidden bg-[#e7e4dc] ${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            loading={featured ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-end bg-gradient-to-br from-[#ddd8cc] to-[#c9c3b5] p-5 text-xs font-semibold text-black/65">
            {locale === 'ar' ? 'صورة العقار غير متاحة' : 'Property image unavailable'}
          </div>
        )}
        <span className="absolute start-4 top-4 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#171713] shadow-sm backdrop-blur">
          {getListingTypeLabel(locale, property.listing_type)}
        </span>
      </div>
      <div className="border-b border-black/20 py-5">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            {city && (
              <p className="mb-2 text-xs font-medium text-black/65">
                {pickLocalized(locale, city.name_ar, city.name_en)}
              </p>
            )}
            <h3 className="text-xl font-semibold leading-snug text-[#171713] sm:text-2xl">
              {title}
            </h3>
          </div>
          <span
            aria-hidden="true"
            className="text-tenant-primary mt-1 text-lg transition-transform group-hover:-translate-x-1 motion-reduce:transition-none rtl:group-hover:translate-x-1"
          >
            {arrow(locale)}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-black/70">
            {getPropertyTypeLabel(locale, property.property_type)}
            {property.area_sqm ? ` · ${property.area_sqm} م²` : ''}
          </p>
          <p className="whitespace-nowrap font-bold text-[#171713]">
            {formatPrice(locale, property.price)}
          </p>
        </div>
      </div>
    </a>
  );
}

export function LavenderProject({
  project,
  city,
  locale,
}: {
  project: PublicProject;
  city?: City;
  locale: Locale;
  featured?: boolean;
}) {
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const image =
    project.media?.find((media) => media.is_primary && media.media_type === 'image')?.url ??
    project.media?.find((media) => media.media_type === 'image')?.url;
  const completion =
    typeof project.completion_percentage === 'number'
      ? Math.min(100, Math.max(0, project.completion_percentage))
      : null;

  return (
    <a
      href={localizedPath(locale, `/projects/${project.slug ?? project.id}`)}
      className="focus-visible:ring-tenant-primary group block w-[68vw] max-w-[285px] shrink-0 snap-center outline-none focus-visible:ring-2 focus-visible:ring-offset-4 sm:w-[300px] sm:max-w-[300px] lg:w-[320px] lg:max-w-[320px]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#272720]">
        {image ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025] motion-reduce:transition-none"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-[#46453e] to-[#1d1d19]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <h3 className="text-lg font-semibold leading-tight sm:text-xl">{title}</h3>
          {city && (
            <p className="mt-1.5 text-xs text-white/85 sm:text-sm">
              {pickLocalized(locale, city.name_ar, city.name_en)}
            </p>
          )}
          {completion != null && (
            <div className="mt-3 sm:mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs text-white sm:text-sm">
                <span>{locale === 'ar' ? 'مكتمل' : 'Completed'}</span>
                <span className="font-semibold tabular-nums">{completion}%</span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-white/30"
                role="progressbar"
                aria-label={locale === 'ar' ? 'نسبة اكتمال المشروع' : 'Project completion'}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={completion}
              >
                <div
                  className="bg-tenant-primary h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
