'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';

const COPY = {
  ar: { label: 'تصفية المشاريع', city: 'المدينة', all: 'جميع المدن', clear: 'مسح التصفية' },
  en: { label: 'Filter projects', city: 'City', all: 'All cities', clear: 'Clear filter' },
} as const;

export function LavenderProjectFilters({
  locale,
  cities,
  cityId,
}: {
  locale: Locale;
  cities: City[];
  cityId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = COPY[locale];

  function update(nextCityId: string) {
    const query = new URLSearchParams();
    if (nextCityId) query.set('city_id', nextCityId);
    router.push(`${pathname}${query.size ? `?${query.toString()}` : ''}`);
  }

  return (
    <div className="flex flex-col gap-3 border-y border-black/15 py-4 sm:flex-row sm:items-end sm:justify-between">
      <label className="flex w-full max-w-sm flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[.16em] text-black/45">
          {t.label}
        </span>
        <span className="sr-only">{t.city}</span>
        <select
          value={cityId ?? ''}
          onChange={(event) => update(event.target.value)}
          className="focus:border-tenant-primary min-h-12 w-full border-0 border-b border-black/30 bg-transparent px-0 text-sm outline-none transition"
        >
          <option value="">{t.all}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {pickLocalized(locale, city.name_ar, city.name_en)}
            </option>
          ))}
        </select>
      </label>

      {cityId && (
        <button
          type="button"
          onClick={() => update('')}
          className="self-start border-b border-black/40 pb-1 text-xs font-medium text-black/60 transition hover:text-black sm:mb-3 sm:self-end"
        >
          {t.clear}
        </button>
      )}
    </div>
  );
}
