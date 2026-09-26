'use client';

import { useMemo, useState } from 'react';

type GalleryItem = {
  id: string;
  url: string;
  alt: string;
};

type GalleryGroup = {
  key: 'gallery' | 'master_plan' | 'construction';
  label: string;
  items: GalleryItem[];
};

export function LavenderProjectMediaGallery({
  groups,
  locale,
}: {
  groups: GalleryGroup[];
  locale: 'ar' | 'en';
}) {
  const availableGroups = useMemo(() => groups.filter((group) => group.items.length > 0), [groups]);
  const [activeKey, setActiveKey] = useState<GalleryGroup['key']>(
    availableGroups[0]?.key ?? 'gallery',
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (!availableGroups.length) return null;

  const activeGroup =
    availableGroups.find((group) => group.key === activeKey) ?? availableGroups[0]!;
  const activeItem = activeGroup.items[activeIndex] ?? activeGroup.items[0]!;

  const selectGroup = (key: GalleryGroup['key']) => {
    setActiveKey(key);
    setActiveIndex(0);
  };

  const move = (direction: -1 | 1) => {
    const length = activeGroup.items.length;
    if (length < 2) return;
    setActiveIndex((current) => (current + direction + length) % length);
  };

  return (
    <section
      aria-label={locale === 'ar' ? 'وسائط المشروع' : 'Project media'}
      className="px-5 pb-10 pt-3 sm:px-6 sm:pb-12 sm:pt-4 lg:pb-14 lg:pt-5"
    >
      <div className="mx-auto max-w-[680px]">
        <div className="relative pb-7 sm:pb-8">
          <div className="relative overflow-hidden rounded-[.8rem] bg-black/[.04] sm:rounded-[1rem]">
            <img
              key={activeItem.id}
              src={activeItem.url}
              alt={activeItem.alt}
              className="aspect-[16/10] w-full object-cover sm:aspect-[16/9]"
            />

            {activeGroup.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? 1 : -1)}
                  aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                  className="absolute start-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white/95 text-[#171713] shadow-sm backdrop-blur-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:start-4 sm:size-11 sm:text-xl"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 sm:size-5"><path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? -1 : 1)}
                  aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                  className="bg-tenant-primary absolute end-2.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 text-white shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:end-4 sm:size-11 sm:text-xl"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4 sm:size-5"><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </>
            )}

            <div className="hidden">
              {activeIndex + 1} / {activeGroup.items.length}
            </div>
          </div>

          <div className="absolute inset-x-[5%] bottom-0 z-10 flex min-h-[3.25rem] items-center justify-center rounded-[.8rem] bg-white px-1.5 shadow-[0_12px_28px_rgba(23,23,19,.12)] sm:inset-x-[8%] sm:min-h-[3.75rem] sm:px-3">
            {availableGroups.map((group) => {
              const active = group.key === activeGroup.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => selectGroup(group.key)}
                  className={`relative flex min-h-9 flex-1 items-center justify-center whitespace-nowrap px-1 text-[.62rem] font-medium transition sm:min-h-11 sm:px-2 sm:text-sm ${active ? 'text-tenant-primary' : 'text-[#173f5f] hover:text-tenant-primary'}`}
                >
                  <span>{group.label}</span>
                  <span className="hidden">
                    {String(group.items.length).padStart(2, '0')}
                  </span>
                  {active && (
                    <span className="bg-tenant-primary absolute inset-x-[18%] bottom-0 h-[2px] rounded-full sm:inset-x-[22%]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden">
          <span>{activeGroup.label}</span>
          <span className="tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(activeGroup.items.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}
