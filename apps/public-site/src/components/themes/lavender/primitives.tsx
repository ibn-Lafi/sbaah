import type { ReactNode } from 'react';

export function LavenderSection({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-5 py-16 sm:px-6 sm:py-24 lg:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

export function LavenderHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 grid gap-7 border-t border-black/15 pt-5 sm:mb-14 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:mb-16">
      <div className="grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-start">
        {eyebrow && (
          <p className="text-tenant-primary pt-1 text-[11px] font-semibold uppercase tracking-[.2em]">
            {eyebrow}
          </p>
        )}
        <h2 className="max-w-4xl text-3xl font-medium leading-[1.16] tracking-[-.02em] text-[#171a17] sm:text-5xl lg:text-[3.5rem]">
          {title}
        </h2>
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </div>
  );
}
