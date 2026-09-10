import { Skeleton } from '@/components/ui/skeleton';

/** Approximates console's Sidebar+Topbar (7 flat nav rows, no groups) as gray pulsing blocks — matches apps/dashboard's DashboardShellSkeleton pattern. Used by (app)/layout.tsx's auth-guard loading state, before /console-auth/me resolves. */
export function ConsoleShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[216px] flex-none flex-col border-e border-border-subtle bg-surface-card p-[10px_10px_18px] md:flex">
        <div className="px-2 pb-[18px]">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex h-[34px] flex-none items-center gap-2 px-[10px]">
              <Skeleton className="h-4 w-4 flex-none rounded-full" />
              <Skeleton className="h-3 flex-none rounded" style={{ width: `${55 + (index % 4) * 10}%` }} />
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
          <Skeleton className="h-5 w-5 flex-none rounded md:hidden" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex-1 overflow-auto p-4 md:p-7">
          <Skeleton className="mb-4 h-9 w-32 rounded-control" />
          <Skeleton className="h-[320px] rounded-card" />
        </div>
      </div>
    </div>
  );
}
