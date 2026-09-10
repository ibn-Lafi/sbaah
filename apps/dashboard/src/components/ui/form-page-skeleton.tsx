import { Card } from './card';
import { Skeleton } from './skeleton';

/** An entity edit page (projects/[id], buildings/[id], rentals/[id], properties/[id], leads/[id]) — a field-shaped card, optionally followed by extra generic section cards (media, notes, related lists). */
export function FormPageSkeleton({ fields = 4, extraCards = 0 }: { fields?: number; extraCards?: number }) {
  return (
    <div className="flex max-w-[720px] flex-col gap-6">
      <Card className="p-8">
        <div className="flex flex-col gap-5">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-[54px] w-full rounded-input" />
            </div>
          ))}
          <Skeleton className="h-[46px] w-32 rounded-control" />
        </div>
      </Card>
      {Array.from({ length: extraCards }).map((_, i) => (
        <Card key={i} className="p-8">
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      ))}
    </div>
  );
}
