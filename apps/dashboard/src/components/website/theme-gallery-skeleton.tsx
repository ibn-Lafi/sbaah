import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors ThemeGallery's real grid — 16:10 preview + label row per card. */
export function ThemeGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-control border-2 border-border-default">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="flex items-center justify-between px-3 py-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
