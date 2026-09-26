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
    <div className={`bg-surface-subtle-3 flex w-full gap-1 rounded-full p-1 ${className} ${className.includes('project-tabs') ? 'justify-center max-sm:w-[calc(100vw-28px)] max-sm:max-w-none max-sm:gap-1 max-sm:overflow-x-auto max-sm:rounded-[18px] max-sm:p-1 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden' : className.includes('settings-tabs') ? 'max-sm:w-[calc(100vw-28px)] max-sm:max-w-none max-sm:justify-start max-sm:gap-1 max-sm:overflow-x-auto max-sm:rounded-[18px] max-sm:p-1 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden' : className.includes('customer-list-tabs') ? 'max-sm:w-full max-sm:rounded-[18px]' : ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-h-10 flex-1 rounded-full px-2 text-[13px] font-semibold leading-tight transition-colors ${className.includes('project-tabs') ? 'max-sm:h-10 max-sm:min-h-10 max-sm:flex-none max-sm:whitespace-nowrap max-sm:px-3.5 max-sm:py-0 max-sm:text-[11px] max-sm:leading-none' : className.includes('settings-tabs') ? 'max-sm:h-10 max-sm:min-h-10 max-sm:flex-none max-sm:whitespace-nowrap max-sm:px-3.5 max-sm:py-0 max-sm:text-[11px] max-sm:leading-none' : className.includes('customer-list-tabs') ? 'h-10 max-sm:min-w-0 max-sm:px-2 max-sm:text-xs' : 'h-10'} ${
            value === option.value ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
