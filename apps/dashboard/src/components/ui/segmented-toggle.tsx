interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedToggleOption<T>[];
  className?: string;
}

/** The pill switch from صفحة الدومين (custom/subdomain) — the one shared "pick one of a small fixed set" pattern, extracted here so every page using it (login's بريد/جوال، الوسطاء والمسوقين) looks and behaves identically instead of each re-styling its own. */
export function SegmentedToggle<T extends string>({ value, onChange, options, className = '' }: SegmentedToggleProps<T>) {
  return (
    <div className={`bg-surface-subtle-3 flex w-full gap-1 rounded-full p-1 ${className}`}>
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
