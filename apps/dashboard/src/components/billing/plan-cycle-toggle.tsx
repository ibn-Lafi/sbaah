import type { BillingCycle } from '@sbaah/shared';
import { useLocale } from '@/lib/i18n/locale-context';

/** Same pill-switcher pattern as domain/page.tsx's custom-domain/subdomain toggle. */
export function PlanCycleToggle({ value, onChange }: { value: BillingCycle; onChange: (cycle: BillingCycle) => void }) {
  const { pages } = useLocale();
  const t = pages.billing.plans.cycleToggle;
  const options: { value: BillingCycle; label: string }[] = [
    { value: 'annual', label: t.annual },
    { value: 'monthly', label: t.monthly },
  ];

  return (
    <div className="mx-auto flex w-[220px] gap-1 rounded-full bg-brand/[.08] p-1 ring-1 ring-brand/15">
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
