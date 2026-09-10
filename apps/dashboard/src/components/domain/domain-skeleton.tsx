import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Renders before /v1/tenant/domain resolves — the real page doesn't yet know which of its two card layouts (custom domain vs. subdomain) applies, so this shows one generic title+field card. */
export function DomainSkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="mb-1 h-4 w-32" />
      <Skeleton className="mb-4 h-3 w-56" />
      <Skeleton className="h-[54px] w-full rounded-input" />
    </Card>
  );
}
