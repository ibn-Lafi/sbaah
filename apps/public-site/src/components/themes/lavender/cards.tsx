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
}: {
  property: PublicProperty;
  city?: City;
  locale: Locale;
  featured?: boolean;
}) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const image = propertyImage(property);
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
  featured = false,
}: {
  project: PublicProject;
  city?: City;
  locale: Locale;
  featured?: boolean;
}) {
  const title = pickLocalized(locale, project.name_ar, project.name_en);
  const description = pickLocalized(
    locale,
    project.description_ar ?? '',
    project.description_en ?? null,
  );
  const image =
    project.media?.find((media) => media.is_primary && media.media_type === 'image')?.url ??
    project.media?.find((media) => media.media_type === 'image')?.url;
  return (
    <a
      href={localizedPath(locale, `/projects/${project.slug ?? project.id}`)}
      className={`focus-visible:ring-tenant-primary group block bg-[#272720] text-white outline-none focus-visible:ring-2 focus-visible:ring-offset-4 ${featured ? 'lg:col-span-2' : ''}`}
    >
      <div
        className={`relative overflow-hidden ${featured ? 'aspect-[16/9] lg:aspect-[16/8]' : 'aspect-[4/3]'}`}
      >
        {image ? (
          <img
            src={image}
            alt={title}
            loading={featured ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-[#46453e] to-[#1d1d19]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
          <div className="mb-3 flex items-center justify-between gap-4 text-xs font-medium text-white/80">
            <span>
              {city
                ? pickLocalized(locale, city.name_ar, city.name_en)
                : locale === 'ar'
                  ? 'مشروع عقاري'
                  : 'Real estate project'}
            </span>
            <span
              aria-hidden="true"
              className="text-xl transition-transform group-hover:-translate-x-1 motion-reduce:transition-none rtl:group-hover:translate-x-1"
            >
              {arrow(locale)}
            </span>
          </div>
          <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{title}</h3>
          {description && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/80">
              {description}
            </p>
          )}
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/30 pt-4 text-xs text-white/80">
            {project.completion_percentage != null && (
              <div>
                <dt className="inline">{locale === 'ar' ? 'الإنجاز' : 'Progress'} </dt>
                <dd className="inline font-bold text-white">{project.completion_percentage}%</dd>
              </div>
            )}
            {project.models_count != null && (
              <div>
                <dt className="inline">{locale === 'ar' ? 'النماذج' : 'Models'} </dt>
                <dd className="inline font-bold text-white">{project.models_count}</dd>
              </div>
            )}
            {project.planned_units_count != null && (
              <div>
                <dt className="inline">{locale === 'ar' ? 'الوحدات' : 'Units'} </dt>
                <dd className="inline font-bold text-white">{project.planned_units_count}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </a>
  );
}
