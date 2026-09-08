import type { UserRole } from '@sbaah/shared';

/** PRODUCT_SPEC.md section 8 — shown in the sidebar's account switcher, never hardcoded per-screen. */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'مالك الحساب',
  admin: 'صلاحية كاملة',
  agent: 'وسيط',
};
