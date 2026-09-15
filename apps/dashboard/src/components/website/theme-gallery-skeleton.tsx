import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors ThemeGallery's real grid/card shape (4:3 preview + status/name/buttons block). */
export function ThemeGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-border-default">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-full sm:h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
