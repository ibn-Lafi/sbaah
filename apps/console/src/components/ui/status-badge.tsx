import type { TenantStatus } from '@sbaah/shared';
import { TENANT_STATUS_LABELS } from '@/lib/tenant/labels';

const STATUS_CLASSES: Record<TenantStatus, string> = {
  active: 'bg-green-50 text-green-700',
  suspended: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {TENANT_STATUS_LABELS[status]}
    </span>
  );
}
