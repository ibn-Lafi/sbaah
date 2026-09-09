import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-11 rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-brand ${className}`}
      {...props}
    />
  );
}
