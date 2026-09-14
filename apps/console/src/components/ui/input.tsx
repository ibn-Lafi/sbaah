import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Matches `Button`'s 46px height instead of the default 54px — see apps/dashboard's Input for why this is an inline style, not a class. */
  compact?: boolean;
}

/** Matches apps/dashboard/src/components/ui/input.tsx. */
export function Input({ className = '', compact = false, style, ...props }: InputProps) {
  return (
    <input
      className={`h-[54px] rounded-input border border-border-default px-4 text-base text-text-primary outline-none focus:border-text-primary focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      style={compact ? { height: '46px', ...style } : style}
      {...props}
    />
  );
}
