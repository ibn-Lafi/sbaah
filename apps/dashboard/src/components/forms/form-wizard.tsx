'use client';

import { Button } from '@/components/ui/button';

interface FormWizardProps {
  steps: string[];
  current: number;
  onStepChange?: (step: number) => void;
}

export function FormWizard({ steps, current, onStepChange }: FormWizardProps) {
  const progress = ((current + 1) / steps.length) * 100;
  return (
    <div className="mb-2">
      <div className="mb-3 flex items-center justify-between sm:hidden">
        <span className="text-sm font-semibold text-text-primary">{steps[current]}</span>
        <span className="text-xs text-text-secondary">الخطوة {current + 1} من {steps.length}</span>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-subtle sm:hidden">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="hidden items-start sm:flex">
        {steps.map((label, index) => {
          const active = index === current;
          const done = index < current;
          return (
            <div key={label} className="flex min-w-0 flex-1 items-start">
              <button type="button" onClick={() => onStepChange?.(index)} className="flex min-w-0 flex-col items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${active ? 'bg-brand text-white' : done ? 'bg-brand-surface text-brand' : 'bg-surface-subtle text-text-secondary'}`}>
                  {done ? '✓' : index + 1}
                </span>
                <span className={`max-w-24 text-center text-xs ${active ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{label}</span>
              </button>
              {index < steps.length - 1 && <div className={`mt-4 h-px flex-1 ${index < current ? 'bg-brand' : 'bg-border-default'}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WizardActions({ step, total, loading, submitLabel, onBack, onNext }: { step: number; total: number; loading: boolean; submitLabel: string; onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
      <Button type="button" variant="secondary" disabled={step === 0 || loading} onClick={onBack}>السابق</Button>
      {step < total - 1 ? (
        <Button type="button" disabled={loading} onClick={onNext}>التالي</Button>
      ) : (
        <Button type="submit" disabled={loading}>{loading ? 'جاري الحفظ...' : submitLabel}</Button>
      )}
    </div>
  );
}
