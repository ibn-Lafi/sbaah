'use client';

import { useState } from 'react';
import { annualSavingsMonths, groupPlansByTier, planForCycle, type BillingCycle, type Plan } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { CheckIcon } from './icons';

/**
 * نفس شريط التبديل شهري/سنوي المستخدم فعليًا بالداشبورد
 * (components/billing/plan-cycle-toggle.tsx) — نفس الأبعاد، الألوان،
 * وترتيب الخيارين (سنوي أولًا ثم شهري) بطلب المؤسس صراحة.
 */
function CycleToggle({
  value,
  onChange,
  labels,
}: {
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  labels: { annual: string; monthly: string };
}) {
  const options: { value: BillingCycle; label: string }[] = [
    { value: 'annual', label: labels.annual },
    { value: 'monthly', label: labels.monthly },
  ];
  return (
    <div className="mx-auto flex w-[220px] gap-1 rounded-full bg-surface-subtle-3 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-10 flex-1 rounded-full text-[13px] font-semibold transition-colors ${
            value === option.value ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PricingCards({
  plans,
  locale,
  dashboardUrl,
}: {
  plans: Plan[];
  locale: Locale;
  dashboardUrl: string | undefined;
}) {
  const t = MARKETING_CONTENT[locale].pricing;
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const tiers = groupPlansByTier(plans);
  // شارة "الأكثر اختيارًا" على الفئة الوسطى فقط عند وجود ٣ فئات فأكثر —
  // مجرّد تمييز بصري لا ادّعاء رقمي حقيقي (لا بيانات مبيعات فعلية متاحة هنا).
  const highlightIndex = tiers.length >= 3 ? Math.floor(tiers.length / 2) : -1;

  return (
    <div className="mt-8 flex flex-col items-center gap-10">
      <CycleToggle value={cycle} onChange={setCycle} labels={t.cycleToggle} />

      {/* صف واحد دائمًا (طلب المؤسس) — أفقيًا قابل للتمرير بالجوال (كل بطاقة
          تأخذ معظم العرض مع تلميح ببطاقة تالية)، وصف واحد ثابت بلا تمرير
          من عرض التابلت فما فوق. */}
      <div className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 sm:gap-6">
        {tiers.map((tier, index) => {
          const plan = planForCycle(tier, cycle);
          const highlighted = index === highlightIndex;
          const savingsMonths =
            cycle === 'annual' && tier.monthly && tier.annual ? annualSavingsMonths(tier.monthly, tier.annual) : 0;

          return (
            <div key={tier.key} className="w-[82%] flex-none snap-center sm:w-[300px] sm:min-w-0 sm:flex-1 sm:snap-align-none">
              <div
                className={`rounded-card relative flex h-full flex-col border bg-surface-card p-8 ${
                  highlighted ? 'border-brand shadow-[0_16px_40px_-12px_rgba(104,69,138,.35)]' : 'border-border-subtle'
                }`}
              >
                {highlighted && (
                  <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white absolute -top-3 start-1/2 -translate-x-1/2">
                    {t.mostPopular}
                  </span>
                )}
                <div className="flex min-h-[20px] items-center">
                  {savingsMonths > 0 && (
                    <span className="rounded-full bg-success-surface px-2.5 py-1 text-xs font-semibold text-success">
                      {t.savingsLabel(savingsMonths)}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-text-primary">
                  {locale === 'ar' ? plan.name_ar : plan.name_en}
                </h3>
                <p className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold text-text-primary" dir="ltr">
                    {plan.price.toLocaleString('en-US')}
                  </span>
                  <span className="text-sm text-text-secondary">
                    {t.currency} {t.priceNote(t.cycleLabel(plan.billing_cycle))}
                  </span>
                </p>
                <p className="mt-1 text-xs text-text-placeholder">{t.vatNote}</p>
                <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-text-secondary">
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 flex-none text-success" />
                      {t.propertiesLimit}
                    </span>
                    <span className="font-medium text-text-primary" dir={plan.max_properties != null ? 'ltr' : undefined}>
                      {plan.max_properties != null ? plan.max_properties.toLocaleString('en-US') : t.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 flex-none text-success" />
                      {t.usersLimit}
                    </span>
                    <span className="font-medium text-text-primary" dir={plan.max_users != null ? 'ltr' : undefined}>
                      {plan.max_users != null ? plan.max_users.toLocaleString('en-US') : t.unlimited}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 flex-none text-success" />
                    {plan.custom_domain_allowed ? t.customDomainYes : t.customDomainNo}
                  </li>
                </ul>
                {dashboardUrl && (
                  <a
                    href={`${dashboardUrl}/register`}
                    className={`rounded-control mt-6 flex h-[48px] items-center justify-center text-center text-sm font-semibold transition-colors ${
                      highlighted
                        ? 'bg-brand text-white hover:bg-brand-hover'
                        : 'border border-border-default text-text-primary hover:bg-surface-subtle'
                    }`}
                  >
                    {t.cta}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
