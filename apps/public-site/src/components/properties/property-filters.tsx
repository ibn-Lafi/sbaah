'use client';

import { useRouter, usePathname } from 'next/navigation';
import { PROPERTY_TYPES, LISTING_TYPES, type City, type District } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';

export interface PropertyFiltersValue {
  city_id?: string;
  district_id?: string;
  property_type?: string;
  listing_type?: string;
  min_price?: string;
  max_price?: string;
  bedrooms?: string;
}

interface PropertyFiltersProps {
  locale: Locale;
  cities: City[];
  districts: District[];
  value: PropertyFiltersValue;
}

const LABELS = {
  ar: { city: 'المدينة', district: 'الحي', type: 'نوع العقار', listing: 'الغرض', min: 'أقل سعر', max: 'أعلى سعر', bedrooms: 'الغرف', any: 'الكل' },
  en: { city: 'City', district: 'District', type: 'Property type', listing: 'Purpose', min: 'Min price', max: 'Max price', bedrooms: 'Bedrooms', any: 'Any' },
};

/** A plain client component whose only job is to translate control changes into URL search params — the actual results (property-grid) are server-rendered by re-reading those params, so search stays crawlable/SSR (PRODUCT_SPEC section 7) even though the controls themselves are interactive. */
export function PropertyFilters({ locale, cities, districts, value }: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = LABELS[locale];

  function update(patch: Partial<PropertyFiltersValue>) {
    const next: PropertyFiltersValue = { ...value, ...patch };
    if (patch.city_id !== undefined && patch.city_id !== value.city_id) {
      next.district_id = undefined;
    }
    const query = new URLSearchParams();
    for (const [key, val] of Object.entries(next)) {
      if (val) query.set(key, val);
    }
    const qs = query.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      <select value={value.listing_type ?? ''} onChange={(e) => update({ listing_type: e.target.value || undefined })} className="rounded-lg border border-black/15 p-2 text-sm">
        <option value="">{t.any}</option>
        {LISTING_TYPES.map((type) => (
          <option key={type} value={type}>
            {getListingTypeLabel(locale, type)}
          </option>
        ))}
      </select>

      <select value={value.property_type ?? ''} onChange={(e) => update({ property_type: e.target.value || undefined })} className="rounded-lg border border-black/15 p-2 text-sm">
        <option value="">{t.type}</option>
        {PROPERTY_TYPES.map((type) => (
          <option key={type} value={type}>
            {getPropertyTypeLabel(locale, type)}
          </option>
        ))}
      </select>

      <select value={value.city_id ?? ''} onChange={(e) => update({ city_id: e.target.value || undefined })} className="rounded-lg border border-black/15 p-2 text-sm">
        <option value="">{t.city}</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {pickLocalized(locale, city.name_ar, city.name_en)}
          </option>
        ))}
      </select>

      <select
        value={value.district_id ?? ''}
        onChange={(e) => update({ district_id: e.target.value || undefined })}
        disabled={!value.city_id}
        className="rounded-lg border border-black/15 p-2 text-sm disabled:opacity-50"
      >
        <option value="">{t.district}</option>
        {districts.map((district) => (
          <option key={district.id} value={district.id}>
            {pickLocalized(locale, district.name_ar, district.name_en)}
          </option>
        ))}
      </select>

      <input
        type="number"
        placeholder={t.min}
        value={value.min_price ?? ''}
        onChange={(e) => update({ min_price: e.target.value || undefined })}
        className="rounded-lg border border-black/15 p-2 text-sm"
      />
      <input
        type="number"
        placeholder={t.max}
        value={value.max_price ?? ''}
        onChange={(e) => update({ max_price: e.target.value || undefined })}
        className="rounded-lg border border-black/15 p-2 text-sm"
      />
      <select value={value.bedrooms ?? ''} onChange={(e) => update({ bedrooms: e.target.value || undefined })} className="rounded-lg border border-black/15 p-2 text-sm">
        <option value="">{t.bedrooms}</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </select>
    </div>
  );
}
