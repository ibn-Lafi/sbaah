import { Skeleton } from '@/components/ui/skeleton';

const BAR_HEIGHTS = [55, 80, 40, 95, 60, 35, 70];

/** Mirrors DashboardHomePage's real layout (4 KPI cards, views chart, latest-leads list) while GET /v1/dashboard/summary is pending. */
export function DashboardHomeSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-[18px] bg-surface-card p-5 shadow-[0_2px_12px_rgba(31,29,34,.06)]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-[18px] rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
          <div className="flex h-[240px] items-end gap-1.5">
            {BAR_HEIGHTS.map((height, i) => (
              <Skeleton key={i} className="w-full flex-1 rounded-t-lg" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex flex-col">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-[11px] border-b border-surface-subtle py-2.5 last:border-0">
                <Skeleton className="h-[34px] w-[34px] flex-none rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
