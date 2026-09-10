import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors تخصيص الثيم's real full-screen layout (toolbar, panel on the right, preview on the left — see site/editor/page.tsx) while GET /v1/website is pending. */
export function EditorSkeleton() {
  return (
    <div className="flex h-screen flex-col bg-surface-page">
      <div className="relative flex h-14 flex-none items-center gap-2 border-b border-border-subtle bg-surface-card px-4">
        <Skeleton className="h-9 w-9 rounded-control" />
        <div className="absolute left-1/2 top-1/2 h-9 w-[84px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-subtle-3" />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[360px] flex-none flex-col gap-4 border-e border-border-subtle bg-surface-card p-4">
          <Skeleton className="h-5 w-32" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-3 border-b border-border-subtle pb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-center bg-surface-page p-6">
          <Skeleton className="h-full w-full max-w-[900px] rounded-input" />
        </div>
      </div>
    </div>
  );
}
