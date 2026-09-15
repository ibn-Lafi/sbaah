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
