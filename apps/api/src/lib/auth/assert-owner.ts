import { ApiError } from '@/lib/http';
import type { UserRole } from '@sbaah/shared';

/** Some actions (custom domain, billing) are Owner-only per PRODUCT_SPEC section 8 — Admin is explicitly excluded ("Admin: كل شيء عدا الفوترة"). */
export function assertOwner(role: UserRole): void {
  if (role !== 'owner') {
    throw new ApiError(403, 'forbidden', 'هذا الإجراء متاح لمالك الحساب فقط');
  }
}
