import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-[100px] rounded-input border border-border-default px-4 py-3 text-base text-text-primary outline-none focus:border-text-primary focus:shadow-[0_0_0_2px_rgba(31,29,34,.08)] ${className}`}
      {...props}
    />
  );
}
