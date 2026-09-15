import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors ThemeGallery's real grid/card shape — full-bleed 4:3 image, bottom-overlaid content. */
export function ThemeGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border-default">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-full sm:h-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
