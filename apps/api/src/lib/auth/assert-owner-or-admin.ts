import { ApiError } from '@/lib/http';
import type { UserRole } from '@sbaah/shared';

/** Team management is Owner+Admin per PRODUCT_SPEC section 8 ("Admin: كل شيء عدا الفوترة وحذف الحساب") — Agent is excluded. */
export function assertOwnerOrAdmin(role: UserRole): void {
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'forbidden', 'هذا الإجراء متاح لمالك الحساب أو المدير فقط');
  }
}
