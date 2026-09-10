/** Matches apps/dashboard/src/components/layout/topbar.tsx's height/border/spacing — title only (console has no cross-section search, and no per-tenant site to link to). */
export function Topbar({ title }: { title: string }) {
  return (
    <div className="flex h-[72px] flex-none items-center gap-4 border-b border-border-subtle bg-surface-card px-7">
      <div className="text-[19px] font-semibold text-text-primary">{title}</div>
    </div>
  );
}
