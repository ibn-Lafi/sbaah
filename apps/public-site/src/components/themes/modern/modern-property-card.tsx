import Link from 'next/link';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import type { PublicProperty } from '@/lib/api/public-properties';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel } from '@/lib/property/labels';

function formatPrice(locale: Locale, price: number): string {
  const amount = price.toLocaleString('en-US');
  return locale === 'ar' ? `${amount} ر.س` : `SAR ${amount}`;
}

/**
 * Modern theme's own card — image-with-overlay style (title/price sit on
 * the photo itself), distinct from Classic's image-above-details card
 * (`@/components/properties/property-card`, still used unchanged on the
 * full `/properties` listing pages, which aren't themed). Homepage-only.
 */
export function ModernPropertyCard({ property, city, locale }: { property: PublicProperty; city: City | undefined; locale: Locale }) {
  const title = pickLocalized(locale, property.title_ar, property.title_en);
  const thumbnail = [...property.property_media]
    .filter((media) => media.media_type === 'image')
    .sort((a, b) => a.order_index - b.order_index)[0];
  const href = locale === 'ar' ? `/properties/${property.id}` : `/en/properties/${property.id}`;

  return (
    <Link href={href} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-black/5">
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnail.url} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
        <span className="w-fit rounded-full bg-white/20 px-3 py-0.5 text-xs font-medium backdrop-blur">
          {getListingTypeLabel(locale, property.listing_type)}
        </span>
        <h3 className="truncate text-lg font-bold">{title}</h3>
        <p className="text-sm text-white/80">{city ? pickLocalized(locale, city.name_ar, city.name_en) : ''}</p>
        <p className="font-semibold">{formatPrice(locale, property.price)}</p>
      </div>
    </Link>
  );
}
