import type { ReactNode } from 'react';

export function ClassicSection({
  children,
  className = '',
  contained = true,
}: {
  children: ReactNode;
  className?: string;
  contained?: boolean;
}) {
  const body = contained ? <div className="mx-auto w-full max-w-6xl px-5 sm:px-6">{children}</div> : children;
  return <section className={`w-full py-12 sm:py-16 lg:py-20 ${className}`}>{body}</section>;
}

export function ClassicSectionHeading({
  title,
  action,
  centered = false,
}: {
  title: string;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={`mb-7 flex gap-4 sm:mb-8 ${centered ? 'flex-col items-center text-center' : 'items-end justify-between'}`}>
      <h2 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
        <span className="me-3 inline-block h-7 w-1 rounded-full bg-tenant-secondary align-middle" aria-hidden="true" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function ClassicEmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.025] px-6 py-10 text-center text-sm text-black/55">
      {children}
    </div>
  );
}
