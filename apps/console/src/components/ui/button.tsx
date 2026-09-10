import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary:
    'bg-surface-card text-text-primary border border-border-default hover:bg-surface-subtle',
  danger: 'bg-transparent text-danger hover:bg-danger-surface',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner before the children and disables the button — pass alongside `children` that already read as a loading label. */
  loading?: boolean;
}

/** Matches apps/dashboard/src/components/ui/button.tsx (UI/UX audit finding — console's Button had no variant/loading support). */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-control inline-flex h-[46px] cursor-pointer items-center justify-center gap-2 px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
