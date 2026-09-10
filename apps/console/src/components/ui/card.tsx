import type { HTMLAttributes } from 'react';

/** Matches apps/dashboard/src/components/ui/card.tsx. */
export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card bg-surface-card shadow-[0_2px_12px_rgba(31,29,34,.06)] ${className}`}
      {...props}
    />
  );
}
