import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors BillingPage's real layout (current-plan card, usage card with 2 bars). */
export function BillingSkeleton() {
  return (
    <>
      <Card className="p-6">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-3 h-8 w-40" />
        <Skeleton className="h-3 w-32" />
      </Card>
      <Card className="flex flex-col gap-4 p-6">
        <Skeleton className="h-4 w-28" />
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </Card>
      <Card className="flex flex-col gap-3 p-6">
        <Skeleton className="h-4 w-24" />
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-input" />
        ))}
      </Card>
    </>
  );
}
