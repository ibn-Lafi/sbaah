import type { City } from '@sbaah/shared';
import { PROPERTY_TYPES, LISTING_TYPES } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';

const LABELS = {
  ar: { type: 'نوع العقار', anyType: 'نوع العقار', city: 'موقع العقار', anyCity: 'أدخل المدينة أو المنطقة', listing: 'حالة العقار', anyListing: 'بيع / ايجار', submit: 'بحث' },
  en: { type: 'Property type', anyType: 'Property type', city: 'Location', anyCity: 'City or area', listing: 'Status', anyListing: 'Sale / rent', submit: 'Search' },
};

const SELECT_CLASSES =
  'h-12 w-full rounded-xl border-0 bg-transparent px-4 text-sm text-black outline-none [color-scheme:light]';

/**
 * A real GET form — no JS, no client component — submitting straight to
 * `/properties`, which already reads and applies `property_type`/`city_id`/
 * `listing_type` from the query string (see that page's own `searchParams`
 * handling). Shared by every theme's hero since the search itself isn't
 * theme-specific, only the surrounding visual chrome each hero wraps it in.
 */
export function PropertySearchBar({ locale, cities }: { locale: Locale; cities: City[] }) {
  const t = LABELS[locale];
  const propertiesHref = locale === 'ar' ? '/properties' : '/en/properties';

  return (
    <form
      method="get"
      action={propertiesHref}
      className="grid grid-cols-1 items-stretch gap-2 rounded-2xl bg-white p-2 text-start shadow-[0_8px_30px_rgba(0,0,0,.15)] sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-0 sm:divide-x sm:divide-black/10 rtl:sm:divide-x-reverse"
    >
      <label className="flex flex-col gap-1 px-2 py-1">
        <span className="text-xs font-medium text-black/50">{t.type}</span>
        <select name="property_type" defaultValue="" className={SELECT_CLASSES}>
          <option value="">{t.anyType}</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {getPropertyTypeLabel(locale, type)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 px-2 py-1">
        <span className="text-xs font-medium text-black/50">{t.city}</span>
        <select name="city_id" defaultValue="" className={SELECT_CLASSES}>
          <option value="">{t.anyCity}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {pickLocalized(locale, city.name_ar, city.name_en)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 px-2 py-1">
        <span className="text-xs font-medium text-black/50">{t.listing}</span>
        <select name="listing_type" defaultValue="" className={SELECT_CLASSES}>
          <option value="">{t.anyListing}</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {getListingTypeLabel(locale, type)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="flex items-center justify-center rounded-xl bg-tenant-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 sm:my-1 sm:me-1"
      >
        {t.submit}
      </button>
    </form>
  );
}
