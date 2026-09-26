'use client';

import { useState } from 'react';
import { ASSET_TYPES, LISTING_TYPES, type City } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { getListingTypeLabel, getPropertyTypeLabel } from '@/lib/property/labels';
import type { HeroSearchMode } from '@sbaah/shared';

type SearchScope = 'projects' | 'properties';

const COPY = {
  ar: {
    projects: 'المشاريع',
    properties: 'العقارات المستقلة',
    city: 'المدينة',
    allCities: 'جميع المدن',
    type: 'نوع العقار',
    allTypes: 'جميع الأنواع',
    purpose: 'الغرض',
    allPurposes: 'بيع أو إيجار',
    projectsSubmit: 'استعرض المشاريع',
    propertiesSubmit: 'ابحث عن عقار',
  },
  en: {
    projects: 'Projects',
    properties: 'Independent properties',
    city: 'City',
    allCities: 'All cities',
    type: 'Property type',
    allTypes: 'All types',
    purpose: 'Purpose',
    allPurposes: 'Sale or rent',
    projectsSubmit: 'Explore projects',
    propertiesSubmit: 'Find a property',
  },
} as const;

const fieldClass =
  'h-10 w-full border-0 bg-transparent px-0 text-base text-[#171a17] outline-none [color-scheme:light] sm:h-12 sm:text-sm';

export function LavenderHeroSearch({
  locale,
  cities,
  mode,
}: {
  locale: Locale;
  cities: City[];
  mode: Exclude<HeroSearchMode, 'none'>;
}) {
  const scopes: SearchScope[] = mode === 'both' ? ['projects', 'properties'] : [mode];
  const [scope, setScope] = useState<SearchScope>(
    mode === 'properties' ? 'properties' : 'projects',
  );
  const t = COPY[locale];
  const action = locale === 'ar' ? `/${scope}` : `/en/${scope}`;
  return (
    <div className="w-full overflow-hidden rounded-xl bg-[#f7f5ef] text-[#171a17] shadow-[0_18px_48px_rgba(0,0,0,.18)] sm:rounded-none sm:shadow-[0_22px_70px_rgba(0,0,0,.2)]">
      {scopes.length > 1 && (
        <div
          className="flex border-b border-black/10"
          role="tablist"
          aria-label={locale === 'ar' ? 'نوع البحث' : 'Search type'}
        >
          {scopes.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={scope === value}
              onClick={() => setScope(value)}
              className={`relative min-h-12 flex-1 px-4 text-xs font-semibold transition-colors sm:min-h-14 sm:flex-none sm:px-9 sm:text-sm ${scope === value ? 'after:bg-tenant-primary text-[#171a17] after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 sm:after:inset-x-9' : 'text-black/45 hover:text-black'}`}
            >
              {t[value]}
            </button>
          ))}
        </div>
      )}
      <form method="get" action={action} className="grid lg:grid-cols-[1fr_1fr_1fr_auto]">
        {scope === 'properties' && (
          <label className="border-b border-black/10 px-4 py-2 sm:px-5 sm:py-3 lg:border-b-0 lg:border-e">
            <span className="block text-[11px] font-semibold text-black/45">{t.purpose}</span>
            <select name="listing_type" defaultValue="" className={fieldClass}>
              <option value="">{t.allPurposes}</option>
              {LISTING_TYPES.map((value) => (
                <option key={value} value={value}>
                  {getListingTypeLabel(locale, value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {scope === 'properties' && (
          <label className="border-b border-black/10 px-4 py-2 sm:px-5 sm:py-3 lg:border-b-0 lg:border-e">
            <span className="block text-[11px] font-semibold text-black/45">{t.type}</span>
            <select name="property_type" defaultValue="" className={fieldClass}>
              <option value="">{t.allTypes}</option>
              {ASSET_TYPES.map((value) => (
                <option key={value} value={value}>
                  {getPropertyTypeLabel(locale, value)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label
          className={`border-b border-black/10 px-4 py-2 sm:px-5 sm:py-3 lg:border-b-0 lg:border-e ${scope === 'projects' ? 'lg:col-span-3' : ''}`}
        >
          <span className="block text-[11px] font-semibold text-black/45">{t.city}</span>
          <select name="city_id" defaultValue="" className={fieldClass}>
            <option value="">{t.allCities}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {pickLocalized(locale, city.name_ar, city.name_en)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="bg-tenant-primary min-h-12 px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:min-h-16 sm:px-8 lg:min-h-20 lg:min-w-48"
        >
          {scope === 'projects' ? t.projectsSubmit : t.propertiesSubmit}
        </button>
      </form>
    </div>
  );
}
