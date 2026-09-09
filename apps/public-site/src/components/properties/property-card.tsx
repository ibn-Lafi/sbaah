import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { PublicProperty } from '@/lib/api/public-properties';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';

function formatPrice(locale: Locale, price: number): string {
  const amount = price.toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US');
  return locale === 'ar' ? `${amount} ر.س` : `SAR ${amount}`;
}

/** Single-property detail page is task 34/42 — cards render as plain (non-clickable) info for now rather than link to a route that doesn't exist yet. */
export function PropertyCard({ property, city, locale }: { property: PublicProperty; city: City | undefined; locale: Locale }) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const thumbnail = [...property.property_media]
    .filter((media) => media.media_type === 'image')
    .sort((a, b) => a.order_index - b.order_index)[0];

  return (
    <div className="overflow-hidden rounded-xl border border-black/10">
      <div className="aspect-[4/3] bg-black/5">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnail.url} alt={title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <span className="text-xs font-medium text-tenant-primary">{getListingTypeLabel(locale, property.listing_type)}</span>
        <h3 className="truncate font-semibold">{title}</h3>
        <p className="text-sm text-black/60">
          {getPropertyTypeLabel(locale, property.property_type)}
          {city ? ` · ${pickLocalized(locale, city.name_ar, city.name_en)}` : ''}
        </p>
        <p className="text-sm text-black/60">
          {property.area_sqm} m²
          {property.bedrooms !== null ? ` · ${property.bedrooms} ${locale === 'ar' ? 'غرف' : 'bd'}` : ''}
          {property.bathrooms !== null ? ` · ${property.bathrooms} ${locale === 'ar' ? 'حمامات' : 'ba'}` : ''}
        </p>
        <p className="mt-1 font-semibold">{formatPrice(locale, property.price)}</p>
      </div>
    </div>
  );
}
