import type { TenantStatus } from '@sbaah/shared';
import { TENANT_STATUS_LABELS } from '@/lib/tenant/labels';

/** Same semantic tokens/markup as apps/dashboard/src/components/ui/badge.tsx (UI/UX audit finding — console hard-coded bg-green-50/bg-amber-50/bg-red-50 instead). */
const STATUS_CLASSES: Record<TenantStatus, string> = {
  active: 'bg-success-surface text-success',
  suspended: 'bg-warning-surface text-warning',
  cancelled: 'bg-danger-surface text-danger',
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-medium ${STATUS_CLASSES[status]}`}
    >
      {TENANT_STATUS_LABELS[status]}
    </span>
  );
}
