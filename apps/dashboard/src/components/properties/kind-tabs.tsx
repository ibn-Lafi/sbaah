'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const KIND_TABS = [
  { href: '/properties', label: 'الوحدات' },
  { href: '/buildings', label: 'العمارات' },
  { href: '/projects', label: 'المشاريع' },
  { href: '/rentals', label: 'الإيجارات' },
] as const;

/**
 * "العقارات" في تصميم المؤسس صفحة واحدة بتبويبات داخلية (kindTabs) بدل 4
 * عناصر منفصلة بالقائمة الجانبية — هذا تقريب أولي (روابط بين 4 صفحات
 * منفصلة كما هي فعليًا) وليس الدمج الكامل بعد؛ الدمج الحقيقي في صفحة
 * واحدة بحالة/بيانات مشتركة مرحلة لاحقة أكبر.
 */
export function KindTabs() {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex max-w-[640px] items-center justify-center gap-0.5 rounded-full bg-surface-card p-[5px] shadow-[0_1px_6px_rgba(31,29,34,.08)]">
      {KIND_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-[34px] flex-1 items-center justify-center rounded-full px-[18px] text-[13px] ${
              active ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-secondary'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
