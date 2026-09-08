import { ApiError } from '@/lib/http';
import type { UserRole } from '@sbaah/shared';

/** PRODUCT_SPEC section 8: Agent has no website access at all — not even read. Used by every /v1/website* endpoint. */
export function assertNotAgent(role: UserRole): void {
  if (role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية الوصول لمحرر الموقع');
  }
}
