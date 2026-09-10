import { Skeleton } from '@/components/ui/skeleton';

/** Approximate widths, not exact nav labels — this renders before /v1/auth/me resolves, so the real role-gated item list isn't known yet. */
const SIDEBAR_ROW_WIDTHS = ['70%', '85%', '60%', '90%', '75%', '65%', '55%'];

/**
 * The (app)/layout.tsx auth-guard's loading state — approximates the
 * real AppShell (Sidebar + Topbar + content cards) as gray pulsing
 * blocks instead of a blank page behind a spinner, so "entering the
 * dashboard" reads as the shell arriving rather than a content-free
 * wait. Static, layout-only — nothing here is real data.
 */
export function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-[216px] flex-none flex-col border-e border-border-subtle bg-surface-card p-[10px_10px_18px]">
        <div className="px-2 pb-[18px]">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {SIDEBAR_ROW_WIDTHS.map((width, index) => (
            <div key={index} className="flex h-[34px] flex-none items-center gap-2 px-[10px]">
              <Skeleton className="h-4 w-4 flex-none rounded-full" />
              <Skeleton className="h-3 flex-none rounded" style={{ width }} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-[9px] border-t border-border-subtle px-2 pt-[10px]">
          <Skeleton className="h-8 w-8 flex-none rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-[72px] flex-none items-center gap-4 border-b border-border-subtle bg-surface-card px-7">
          <Skeleton className="h-5 w-32" />
          <div className="flex-1" />
          <Skeleton className="h-[42px] w-[280px] rounded-full" />
          <Skeleton className="h-[42px] w-[42px] flex-none rounded-full" />
        </div>
        <div className="flex-1 overflow-auto p-7">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[110px] rounded-[18px]" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-[320px] rounded-[18px]" />
            <Skeleton className="h-[320px] rounded-[18px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
