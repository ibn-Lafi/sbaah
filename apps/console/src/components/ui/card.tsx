import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-white shadow-[0_2px_12px_rgba(31,29,34,.08)] ${className}`} {...props} />;
}
