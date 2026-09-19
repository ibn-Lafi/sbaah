'use client';

import React from 'react';
import { useLocale } from '@/lib/i18n/locale-context';

const FEATURES = [
  { ar: 'الموقع العقاري', en: 'Real estate website', platinum: 'yes', gold: 'yes' },
  { ar: 'متجر الثيمات', en: 'Theme store', platinum: 'yes', gold: 'yes' },
  { ar: 'تخصيص الموقع', en: 'Website customization', platinum: 'yes', gold: 'yes' },
  { ar: 'العقارات والعمارات', en: 'Properties & buildings', platinum: 'yes', gold: 'yes' },
  { ar: 'إدارة الإيجارات', en: 'Rental management', platinum: 'yes', gold: 'yes' },
  { ar: 'CRM والعملاء', en: 'CRM & leads', platinum: 'yes', gold: 'yes' },
  { ar: 'المعاينات', en: 'Viewings', platinum: 'yes', gold: 'yes' },
  { ar: 'المشاريع العقارية', en: 'Real estate projects', platinum: 'no', gold: 'yes' },
  { ar: 'التقارير والإحصائيات المتقدمة', en: 'Advanced reports & analytics', platinum: 'basic', gold: 'yes' },
  { ar: 'Google Analytics', en: 'Google Analytics', platinum: 'no', gold: 'yes' },
  { ar: 'الدومين المخصص', en: 'Custom domain', platinum: 'no', gold: 'yes' },
] as const;

function Value({ value, locale }: { value: 'yes' | 'no' | 'basic'; locale: 'ar' | 'en' }) {
  if (value === 'yes') return <span className="font-semibold text-success">✓</span>;
  if (value === 'basic') return <span className="text-xs font-medium text-text-secondary">{locale === 'ar' ? 'أساسية' : 'Basic'}</span>;
  return <span className="text-text-placeholder">—</span>;
}

export function PlanComparisonButton() {
  const { locale } = useLocale();
  const [open, setOpen] = React.useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle flex h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors">
      {locale === 'ar' ? 'مقارنة الباقات' : 'Compare plans'}
    </button>
    {open && <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" className="bg-surface-card flex max-h-[92dvh] w-full flex-col rounded-t-[28px] shadow-2xl sm:max-w-[760px] sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
        <div className="border-border-subtle flex flex-none items-center justify-between border-b px-5 py-4 sm:px-6">
          <div><h2 className="text-lg font-bold text-text-primary">{locale === 'ar' ? 'مقارنة الباقات' : 'Compare plans'}</h2><p className="mt-0.5 text-xs text-text-secondary">{locale === 'ar' ? 'اختر الباقة التي تناسب احتياجك' : 'Choose the plan that fits your needs'}</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label={locale === 'ar' ? 'إغلاق' : 'Close'} className="bg-surface-subtle text-text-secondary flex h-9 w-9 items-center justify-center rounded-full text-xl">×</button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="border-border-subtle w-full overflow-hidden rounded-[18px] border sm:rounded-[20px]">
            <div className="bg-surface-header grid grid-cols-[minmax(0,1fr)_64px_64px] sm:grid-cols-[minmax(240px,1fr)_160px_160px]">
              <div className="px-3 py-3 text-[11px] sm:px-4 sm:text-sm font-semibold text-text-secondary">{locale === 'ar' ? 'الميزة' : 'Feature'}</div><div className="px-1 py-3 text-center text-[10px] sm:px-3 sm:text-sm font-bold text-text-primary">Platinum</div><div className="px-1.5 py-3 text-center text-[11px] sm:px-3 sm:text-sm font-bold text-text-primary">Gold</div>
            </div>
            {FEATURES.map((feature) => <div key={feature.en} className="border-border-subtle grid grid-cols-[minmax(0,1fr)_64px_64px] border-t sm:grid-cols-[minmax(240px,1fr)_160px_160px]">
              <div className="min-w-0 px-3 py-3 text-[11px] leading-5 text-text-primary sm:px-4 sm:text-sm">{locale === 'ar' ? feature.ar : feature.en}</div><div className="flex min-w-0 items-center justify-center px-1 py-3 sm:px-3"><Value value={feature.platinum} locale={locale} /></div><div className="flex items-center justify-center px-1.5 py-3 sm:px-3"><Value value={feature.gold} locale={locale} /></div>
            </div>)}
          </div>
        </div>
      </div>
    </div>}
  </>;
}
