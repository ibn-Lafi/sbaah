import type { SelectHTMLAttributes } from 'react';

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-11 rounded-lg border border-black/15 bg-white px-3 text-sm outline-none focus:border-brand ${className}`}
      {...props}
    />
  );
}
