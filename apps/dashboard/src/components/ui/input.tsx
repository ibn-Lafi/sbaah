import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Matches `Button`'s 46px height instead of the default 54px — for an
   * `Input` sitting in the same row as a `Button`. An inline style, not a
   * Tailwind class: Tailwind v4 doesn't guarantee a later class in the
   * same string wins over `h-[54px]` above based on source order
   * (documented elsewhere in this codebase), while an inline style
   * always wins regardless.
   */
  compact?: boolean;
}

export function Input({ className = '', compact = false, style, ...props }: InputProps) {
  return (
    <input
      className={`rounded-input border-border-default text-text-primary focus:border-text-primary h-[48px] w-full md:h-[54px] min-w-0 border px-3.5 text-sm md:px-4 md:text-base outline-none focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      style={compact ? { height: '46px', ...style } : style}
      {...props}
    />
  );
}
