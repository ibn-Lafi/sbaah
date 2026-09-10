import { Card } from './card';
import { Skeleton } from './skeleton';

/** A short list of card rows (title + subtitle), e.g. الصفحات. */
export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} className="flex items-center justify-between gap-3 p-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </Card>
      ))}
    </>
  );
}
