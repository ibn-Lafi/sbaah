'use client';
import { useRouter, usePathname } from 'next/navigation';
import { ASSET_TYPES, LISTING_TYPES, type City, type District } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import type { PropertyFiltersValue } from '@/components/properties/property-filters';

const LABELS = {
  ar: {
    city: 'المدينة',
    district: 'الحي',
    type: 'نوع العقار',
    listing: 'الغرض',
    min: 'أقل سعر',
    max: 'أعلى سعر',
    bedrooms: 'غرف النوم',
    any: 'الكل',
    clear: 'مسح الفلاتر',
    filters: 'تصفية العقارات',
  },
  en: {
    city: 'City',
    district: 'District',
    type: 'Property type',
    listing: 'Purpose',
    min: 'Min price',
    max: 'Max price',
    bedrooms: 'Bedrooms',
    any: 'Any',
    clear: 'Clear filters',
    filters: 'Property filters',
  },
};

export function LavenderPropertyFilters({
  locale,
  cities,
  districts,
  value,
}: {
  locale: Locale;
  cities: City[];
  districts: District[];
  value: PropertyFiltersValue;
}) {
  const router = useRouter(),
    pathname = usePathname(),
    t = LABELS[locale];
  const update = (patch: Partial<PropertyFiltersValue>) => {
    const next = { ...value, ...patch };
    if (patch.city_id !== undefined && patch.city_id !== value.city_id)
      next.district_id = undefined;
    const q = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    router.push(pathname + (q.size ? '?' + q : ''));
  };
  const cls =
    'min-h-12 w-full border-0 border-b border-black/30 bg-transparent px-0 text-sm text-[#171713] outline-none transition focus-visible:border-tenant-primary focus-visible:ring-2 focus-visible:ring-tenant-primary/30 disabled:cursor-not-allowed disabled:opacity-45';
  const fields = [
    <label key="listing" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.listing}</span>
      <select
        aria-label={t.listing}
        value={value.listing_type ?? ''}
        onChange={(e) => update({ listing_type: e.target.value || undefined })}
        className={cls}
      >
        <option value="">{t.any}</option>
        {LISTING_TYPES.map((x) => (
          <option key={x} value={x}>
            {getListingTypeLabel(locale, x)}
          </option>
        ))}
      </select>
    </label>,
    <label key="type" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.type}</span>
      <select
        aria-label={t.type}
        value={value.property_type ?? ''}
        onChange={(e) => update({ property_type: e.target.value || undefined })}
        className={cls}
      >
        <option value="">{t.any}</option>
        {ASSET_TYPES.map((x) => (
          <option key={x} value={x}>
            {getPropertyTypeLabel(locale, x)}
          </option>
        ))}
      </select>
    </label>,
    <label key="city" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.city}</span>
      <select
        aria-label={t.city}
        value={value.city_id ?? ''}
        onChange={(e) => update({ city_id: e.target.value || undefined })}
        className={cls}
      >
        <option value="">{t.any}</option>
        {cities.map((x) => (
          <option key={x.id} value={x.id}>
            {pickLocalized(locale, x.name_ar, x.name_en)}
          </option>
        ))}
      </select>
    </label>,
    <label key="district" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.district}</span>
      <select
        aria-label={t.district}
        value={value.district_id ?? ''}
        disabled={!value.city_id}
        onChange={(e) => update({ district_id: e.target.value || undefined })}
        className={cls}
      >
        <option value="">{t.any}</option>
        {districts.map((x) => (
          <option key={x.id} value={x.id}>
            {pickLocalized(locale, x.name_ar, x.name_en)}
          </option>
        ))}
      </select>
    </label>,
    <label key="min" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.min}</span>
      <input
        aria-label={t.min}
        type="number"
        min="0"
        inputMode="numeric"
        placeholder="0"
        value={value.min_price ?? ''}
        onChange={(e) => update({ min_price: e.target.value || undefined })}
        className={cls}
      />
    </label>,
    <label key="max" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.max}</span>
      <input
        aria-label={t.max}
        type="number"
        min="0"
        inputMode="numeric"
        placeholder="—"
        value={value.max_price ?? ''}
        onChange={(e) => update({ max_price: e.target.value || undefined })}
        className={cls}
      />
    </label>,
    <label key="bedrooms" className="grid gap-1.5">
      <span className="text-xs font-semibold text-black/65">{t.bedrooms}</span>
      <select
        aria-label={t.bedrooms}
        value={value.bedrooms ?? ''}
        onChange={(e) => update({ bedrooms: e.target.value || undefined })}
        className={cls}
      >
        <option value="">{t.any}</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}+
          </option>
        ))}
      </select>
    </label>,
  ];
  const active = Object.values(value).some(Boolean);
  return (
    <section aria-label={t.filters} className="border-y border-black/15 py-6">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">{fields}</div>
      {active && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="focus-visible:ring-tenant-primary mt-6 border-b border-black/40 pb-1 text-sm font-semibold text-black/75 outline-none hover:text-black focus-visible:ring-2"
        >
          {t.clear}
        </button>
      )}
    </section>
  );
}
