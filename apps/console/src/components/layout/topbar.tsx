/** Matches apps/dashboard/src/components/layout/topbar.tsx's height/border/spacing — title only, plus a hamburger button that only renders below `md` (the sidebar is a fixed column at `md` and up, see sidebar.tsx). */
export function Topbar({ title, onMenuClick }: { title: string; onMenuClick: () => void }) {
  return (
    <div className="flex h-[72px] flex-none items-center gap-4 border-b border-border-subtle bg-surface-card px-7">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="فتح القائمة"
        title="فتح القائمة"
        className="-ms-2 flex h-9 w-9 flex-none items-center justify-center rounded-control text-text-secondary hover:bg-surface-subtle md:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-5 w-5">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="truncate text-[19px] font-semibold text-text-primary">{title}</div>
    </div>
  );
}
