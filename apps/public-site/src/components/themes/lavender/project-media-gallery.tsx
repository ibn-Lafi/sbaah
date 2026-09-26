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
      className="px-4 pb-20 pt-6 sm:px-6 sm:pb-24 lg:pt-10"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="relative pb-12 sm:pb-14">
          <div className="relative overflow-hidden rounded-[1rem] bg-black/[.04] sm:rounded-[1.15rem]">
            <img
              key={activeItem.id}
              src={activeItem.url}
              alt={activeItem.alt}
              className="aspect-[1.08/1] w-full object-cover sm:aspect-[1.18/1] lg:aspect-[1.16/1]"
            />

            {activeGroup.items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? 1 : -1)}
                  aria-label={locale === 'ar' ? 'الصورة السابقة' : 'Previous image'}
                  className="absolute start-3 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-white text-3xl text-[#171713] shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:start-5 sm:size-[4.7rem] sm:text-4xl lg:start-6 lg:size-20"
                >
                  <span aria-hidden="true">{locale === 'ar' ? '→' : '←'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(locale === 'ar' ? -1 : 1)}
                  aria-label={locale === 'ar' ? 'الصورة التالية' : 'Next image'}
                  className="bg-tenant-primary absolute end-3 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-full text-3xl text-white shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tenant-primary sm:end-5 sm:size-[4.7rem] sm:text-4xl lg:end-6 lg:size-20"
                >
                  <span aria-hidden="true">{locale === 'ar' ? '←' : '→'}</span>
                </button>
              </>
            )}

            <div className="hidden">
              {activeIndex + 1} / {activeGroup.items.length}
            </div>
          </div>

          <div className="absolute inset-x-[6%] bottom-0 z-10 flex min-h-[5.2rem] items-center justify-center rounded-[1.15rem] bg-white px-3 shadow-[0_22px_55px_rgba(23,23,19,.16)] sm:inset-x-[6%] sm:min-h-[6.4rem] sm:px-5 lg:inset-x-[6%] lg:min-h-[7.2rem] lg:rounded-[1.25rem] lg:px-7">
            {availableGroups.map((group) => {
              const active = group.key === activeGroup.key;
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => selectGroup(group.key)}
                  className={`relative flex min-h-14 flex-1 items-center justify-center whitespace-nowrap px-1 text-[.78rem] font-medium transition sm:px-3 sm:text-lg lg:min-h-20 lg:px-5 lg:text-2xl ${active ? 'text-tenant-primary' : 'text-[#173f5f] hover:text-tenant-primary'}`}
                >
                  <span>{group.label}</span>
                  <span className="hidden">
                    {String(group.items.length).padStart(2, '0')}
                  </span>
                  {active && (
                    <span className="bg-tenant-primary absolute inset-x-[18%] bottom-0 h-[3px] rounded-full sm:inset-x-[22%]" />
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
