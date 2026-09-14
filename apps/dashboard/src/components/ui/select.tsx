import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Matches `Button`'s 46px height instead of the default 54px — for a
   * `Select` sitting in the same row as a `Button` (a filter next to an
   * "add" action, for example). An inline style, not a Tailwind class:
   * Tailwind v4 doesn't guarantee a later class in the same string wins
   * over `h-[54px]` above based on source order (documented elsewhere in
   * this codebase), while an inline style always wins regardless.
   */
  compact?: boolean;
}

export function Select({ className = '', compact = false, style, ...props }: SelectProps) {
  return (
    <select
      className={`h-[54px] rounded-input border border-border-default px-4 text-base text-text-primary outline-none focus:border-text-primary focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      style={compact ? { height: '46px', ...style } : style}
      {...props}
    />
  );
}
