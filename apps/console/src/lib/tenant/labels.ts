import type { AccountType, TenantStatus } from '@sbaah/shared';

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'نشط',
  suspended: 'معلَّق',
  cancelled: 'ملغى',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};
