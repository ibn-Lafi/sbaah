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
      className="px-4 pb-16 pt-3 sm:px-6 sm:pb-20 lg:pt-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative pb-11 sm:pb-12 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-stretch lg:gap-5 lg:pb-0">
          <div className="relative overflow-hidden rounded-[1.1rem] bg-black/[.04] sm:rounded-[1.35rem]">
            <img
              key={activeItem.id}
              src={activeItem.url}
              alt={activeItem.alt}
              className="aspect-[1.12/1] w-full object-cover sm:aspect-[16/10] lg:aspect-[16/9]"
            />

            {activeGroup.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? 1 : -1)}
                  aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                  className="absolute start-3 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-white text-3xl text-[#171713] shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:start-5 sm:size-16 lg:size-14"
                >
                  <span aria-hidden="true">{locale === 'ar' ? '→' : '←'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? -1 : 1)}
                  aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                  className="absolute end-3 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-white text-3xl text-[#171713] shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:end-5 sm:size-16 lg:size-14"
                >
                  <span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
                </button>
              </>
            )}

            <div className="absolute bottom-4 end-4 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm lg:hidden">
              {activeIndex + 1} / {activeGroup.items.length}
            </div>
          </div>

          <div className="absolute inset-x-5 bottom-0 z-10 flex min-h-[5.4rem] items-center justify-center rounded-2xl bg-white px-2 shadow-[0_18px_50px_rgba(23,23,19,.14)] sm:inset-x-10 sm:min-h-[6rem] lg:static lg:flex-col lg:items-stretch lg:justify-center lg:gap-1 lg:rounded-[1.35rem] lg:px-3 lg:py-4">
            {availableGroups.map((group) => {
              const active = group.key === activeGroup.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => selectGroup(group.key)}
                  className={`relative flex min-h-14 flex-1 items-center justify-center whitespace-nowrap px-2 text-[.82rem] font-semibold transition sm:text-base lg:min-h-16 lg:justify-between lg:rounded-xl lg:px-5 lg:text-start ${active ? 'text-tenant-primary lg:bg-black/[.035]' : 'text-[#173f5f] hover:text-tenant-primary'}`}
                >
                  <span>{group.label}</span>
                  <span className="hidden text-xs tabular-nums text-black/35 lg:inline">
                    {String(group.items.length).padStart(2, '0')}
                  </span>
                  {active && (
                    <span className="bg-tenant-primary absolute inset-x-3 bottom-0 h-0.5 rounded-full lg:inset-y-3 lg:bottom-auto lg:start-auto lg:end-0 lg:h-auto lg:w-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 hidden items-center justify-between text-xs text-black/45 lg:flex">
          <span>{activeGroup.label}</span>
          <span className="tabular-nums">
            {String(activeIndex + 1).padStart(2, '0')} / {String(activeGroup.items.length).padStart(2, '0')}
          </span>
        </div>
      </div>
    </section>
  );
}
