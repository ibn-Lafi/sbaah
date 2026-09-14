import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`rounded-input border-border-default text-text-primary focus:border-text-primary h-[54px] w-full min-w-0 border px-4 text-base outline-none focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      {...props}
    />
  );
}
