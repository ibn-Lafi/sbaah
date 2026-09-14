import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mirrors تخصيص الثيم's real full-screen layout (toolbar, panel on the
 * right, preview on the left — see site/editor/page.tsx) while GET
 * /v1/website is pending. The real page shows a "needs a bigger screen"
 * notice on mobile instead of this desktop layout — this skeleton must
 * match that split (`md:hidden` notice / `hidden md:flex` skeleton), or
 * phones would briefly flash the unconstrained 360px side panel and
 * overflow horizontally during the load, before the real page's own
 * mobile fallback ever gets a chance to render.
 */
export function EditorSkeleton() {
  return (
    <>
      <div className="bg-surface-page flex h-screen items-center justify-center md:hidden">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      <div className="bg-surface-page hidden h-screen flex-col md:flex">
        <div className="border-border-subtle bg-surface-card relative flex h-14 flex-none items-center gap-2 border-b px-4">
          <Skeleton className="rounded-control h-9 w-9" />
          <div className="bg-surface-subtle-3 absolute left-1/2 top-1/2 h-9 w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="border-border-subtle bg-surface-card flex w-[360px] flex-none flex-col gap-4 border-e p-4">
            <Skeleton className="h-5 w-32" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="border-border-subtle flex flex-col gap-3 border-b pb-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
          <div className="bg-surface-page flex min-w-0 flex-1 items-center justify-center p-6">
            <Skeleton className="rounded-input h-full w-full max-w-[900px]" />
          </div>
        </div>
      </div>
    </>
  );
}
