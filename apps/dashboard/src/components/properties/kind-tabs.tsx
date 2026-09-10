'use client';

import Link from 'next/link';

export type PropertyKind = 'units' | 'buildings' | 'projects' | 'rentals';

const KIND_TABS: { kind: PropertyKind; label: string }[] = [
  { kind: 'units', label: 'الوحدات' },
  { kind: 'buildings', label: 'العمارات' },
  { kind: 'projects', label: 'المشاريع' },
  { kind: 'rentals', label: 'الإيجارات' },
];

/** "العقارات" في تصميم المؤسس صفحة واحدة بتبويبات داخلية — /properties?kind=... يبدّل المحتوى دون تنقّل صفحة كاملة. */
export function KindTabs({ active }: { active: PropertyKind }) {
  return (
    <div className="mx-auto flex max-w-[640px] items-center justify-center gap-0.5 rounded-full bg-surface-card p-[5px] shadow-[0_1px_6px_rgba(31,29,34,.08)]">
      {KIND_TABS.map((tab) => {
        const isActive = active === tab.kind;
        return (
          <Link
            key={tab.kind}
            href={tab.kind === 'units' ? '/properties' : `/properties?kind=${tab.kind}`}
            className={`flex h-[34px] flex-1 items-center justify-center rounded-full px-[18px] text-[13px] ${
              isActive ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-secondary'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
