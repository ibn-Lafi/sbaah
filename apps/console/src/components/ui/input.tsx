import type { InputHTMLAttributes } from 'react';

/** Matches apps/dashboard/src/components/ui/input.tsx. */
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-[54px] rounded-input border border-border-default px-4 text-base text-text-primary outline-none focus:border-text-primary focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      {...props}
    />
  );
}
