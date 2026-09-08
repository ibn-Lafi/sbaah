import type { UserStatus } from '@sbaah/shared';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'نشط',
  invited: 'دعوة معلّقة',
  disabled: 'معطّل',
};
