import type { TenantStatus } from '@sbaah/shared';

export { ACCOUNT_TYPE_LABELS } from '@sbaah/shared';

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'نشط',
  suspended: 'معلَّق',
  cancelled: 'ملغى',
};
