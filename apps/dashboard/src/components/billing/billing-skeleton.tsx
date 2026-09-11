import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors BillingPage's real layout — one card: plan name + status badge, 2 usage bars, renewal date + change-plan button. */
export function BillingSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-[46px] w-32 rounded-control" />
      </div>
    </Card>
  );
}
