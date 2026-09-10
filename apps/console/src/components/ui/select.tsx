import type { SelectHTMLAttributes } from 'react';

/** Matches apps/dashboard/src/components/ui/select.tsx. */
export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-[54px] rounded-input border border-border-default px-4 text-base text-text-primary outline-none focus:border-text-primary focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      {...props}
    />
  );
}
