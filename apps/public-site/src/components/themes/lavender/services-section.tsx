'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/locales';
import type { ServicesSectionConfig } from '@sbaah/shared';
import { LavenderSection } from './primitives';

export function LavenderServices({
  locale,
  config,
}: {
  locale: Locale;
  config: ServicesSectionConfig;
}) {
  const items = (config.items ?? []).filter((item) => item.title);
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)]!;

  return (
    <LavenderSection className="overflow-hidden py-12 text-[var(--tenant-primary)] sm:py-16 lg:py-24">
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="mx-auto max-w-6xl">
        <p className="mb-10 text-4xl font-light leading-none text-[var(--tenant-primary)] sm:mb-14 sm:text-6xl">
          {locale === 'ar' ? 'خدماتنا' : 'Services'}
        </p>

        <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-16">
          <div className="order-2 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1" aria-live="polite">
            <h3 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              {current.title}
            </h3>
            {current.description && (
              <p className="text-[var(--tenant-primary)]/70 mt-6 max-w-3xl text-lg leading-[1.9] sm:text-xl lg:text-2xl">
                {current.description}
              </p>
            )}
          </div>

          <div
            className="order-1 flex w-full gap-2 overflow-x-auto border-b border-[var(--tenant-primary)]/15 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-none lg:col-start-1 lg:row-start-1 lg:block lg:overflow-visible lg:border-b-0 lg:border-r-2 lg:pr-5"
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
                  className={`relative shrink-0 whitespace-nowrap px-3 py-3 text-start text-base leading-tight transition-colors sm:text-lg lg:block lg:w-full lg:px-0 lg:text-2xl ${selected ? 'font-medium text-[var(--tenant-primary)]' : 'text-[var(--tenant-primary)]/35 hover:text-[var(--tenant-primary)]/65'}`}
                >
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 bottom-0 h-[2px] bg-[var(--tenant-primary)] lg:inset-x-auto lg:top-0 lg:right-[-22px] lg:h-full lg:w-[3px]"
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
