import type { BillingCycle } from '@sbaah/shared';
import { useLocale } from '@/lib/i18n/locale-context';

/** Same pill-switcher pattern as domain/page.tsx's custom-domain/subdomain toggle. */
export function PlanCycleToggle({ value, onChange, savingsPercent }: { value: BillingCycle; onChange: (cycle: BillingCycle) => void; savingsPercent?: number }) {
  const { pages } = useLocale();
  const t = pages.billing.plans.cycleToggle;
  const options: { value: BillingCycle; label: string }[] = [
    { value: 'monthly', label: t.monthly },
    { value: 'annual', label: t.annual },
  ];

  return (
    <div className="relative mx-auto mt-5 flex w-[220px] gap-1 rounded-full bg-brand/[.08] p-1 ring-1 ring-brand/15">
      {savingsPercent ? <span className="absolute -top-5 end-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold leading-4 text-white shadow-sm">{pages.billing.pageTitle==='Billing & Subscription'?'Save':'وفّر'} {savingsPercent}%</span> : null}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-10 flex-1 rounded-full text-[13px] font-semibold transition-colors ${
            value === option.value ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:bg-surface-subtle hover:text-brand'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
