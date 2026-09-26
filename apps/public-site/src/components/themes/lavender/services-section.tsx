'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/locales';
import type { ServicesSectionConfig } from '@sbaah/shared';
import { LavenderSection } from './primitives';

export function LavenderServices({ locale, config }: { locale: Locale; config: ServicesSectionConfig }) {
  const items = (config.items ?? []).filter((item) => item.title);
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <LavenderSection
      className="overflow-hidden bg-[#f5f1ee] py-12 text-[#173d34] sm:py-16 lg:py-24"
    >
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-6xl">
        <p className="mb-10 text-4xl font-light leading-none text-[#aa8c62] sm:mb-14 sm:text-6xl">
          {locale === 'ar' ? 'خدماتنا' : 'Services'}
        </p>

        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="min-w-0" aria-live="polite">
            <h3 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {current.title}
            </h3>
            {current.description && (
              <p className="mt-6 max-w-3xl text-lg leading-[1.9] text-[#5d5b59] sm:text-xl lg:text-2xl">
                {current.description}
              </p>
            )}
          </div>

          <div
            className={locale === 'ar' ? 'border-r-2 border-[#173d34]/10 pr-4 sm:pr-5' : 'border-l-2 border-[#173d34]/10 pl-4 sm:pl-5'}
            role="tablist"
            aria-label={locale === 'ar' ? 'الخدمات' : 'Services'}
          >
            {items.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(index)}
                  className={`relative block w-full py-3 text-start text-xl leading-tight transition-colors sm:text-2xl ${selected ? 'font-medium text-[#173d34]' : 'text-[#173d34]/35 hover:text-[#173d34]/65'}`}
                >
                  {selected && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 h-full w-[3px] bg-[#173d34] ${locale === 'ar' ? '-right-[18px] sm:-right-[22px]' : '-left-[18px] sm:-left-[22px]'}`}
                    />
                  )}
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </LavenderSection>
  );
}
