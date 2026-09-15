function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

interface RegistrationStepperProps {
  labels: readonly string[];
  currentIndex: number;
}

/**
 * Numbered step progress for التسجيل (5 خطوات) — a connected row of
 * circles instead of the old plain "الخطوة N من 5" caption, so where the
 * visitor stands (and what's left) reads at a glance. Same shape as the
 * common shadcn/reui "stepper" pattern the founder pointed to, rebuilt
 * with this app's own tokens (brand purple, existing text/border
 * colors) instead of pulling in shadcn's component stack (no
 * class-variance-authority/@radix-ui/cn() anywhere in this codebase —
 * every `components/ui/*` primitive here is hand-rolled Tailwind, and
 * this follows that same pattern rather than introducing a new one).
 *
 * Circles + connectors only, no per-step text under each one — at 5
 * steps that text couldn't fit next to real circles on a 360px phone
 * without truncation, and the step's own name is already the heading
 * right below this. `labels` is still required and used as each
 * circle's accessible name, just not rendered visually.
 *
 * RTL-safe: a plain flex row already lays out step 1 on the right in a
 * `dir="rtl"` page, matching reading order without extra logic.
 */
export function RegistrationStepper({ labels, currentIndex }: RegistrationStepperProps) {
  return (
    <ol className="mb-6 flex items-center" aria-label="خطوات إنشاء الحساب">
      {labels.map((label, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === labels.length - 1;

        return (
          <li key={label} className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}>
            <div
              role="img"
              aria-label={`${index + 1}. ${label}${isCurrent ? ' (الخطوة الحالية)' : isDone ? ' (مكتملة)' : ''}`}
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                isDone
                  ? 'bg-brand text-white'
                  : isCurrent
                    ? 'border-brand text-brand border-2 bg-white'
                    : 'border-border-default text-text-placeholder border bg-white'
              }`}
            >
              {isDone ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </div>
            {!isLast && (
              <div className={`mx-1.5 h-0.5 flex-1 rounded-full transition-colors ${isDone ? 'bg-brand' : 'bg-border-default'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
