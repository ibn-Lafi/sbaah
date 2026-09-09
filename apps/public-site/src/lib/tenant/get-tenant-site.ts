import { cache } from 'react';
import type { AccountType, Website, WebsiteSection } from '@sbaah/shared';
import { apiGet, ApiRequestError } from '@/lib/api/client';
import { getHost } from './get-host';

export interface TenantSite {
  tenant: { name_ar: string; name_en: string; account_type: AccountType };
  website: Omit<Website, 'id' | 'tenant_id' | 'theme_id'>;
  sections: Pick<WebsiteSection, 'id' | 'type' | 'order_index' | 'config'>[];
  /** The tenant Owner's phone (task 34/42's WhatsApp click-to-chat button) — `users` has no anon SELECT policy, so `api` resolves this server-side, never queried directly from here. */
  whatsapp_phone: string;
}

/**
 * The one server-side fetch every page/layout in this app needs — reads
 * the incoming `Host` header (how a visitor's browser identifies "whose
 * site is this", PRODUCT_SPEC section 7) and resolves it via `api`.
 * Wrapped in React's `cache()` (request-scoped memoization) so calling
 * this from both the root layout AND a page in the same request hits
 * the network exactly once, with no prop-drilling between them needed.
 *
 * Returns `null` for "no such site" (api's `site_not_found`, migration
 * 0013's `resolve_public_tenant`) so callers can render `notFound()`
 * themselves — a suspended tenant currently resolves the same way as a
 * domain that never existed (the RPC filters `status = 'active'` before
 * this code ever runs), so the two cannot yet be told apart here. Task
 * 36/42 owns building the distinct "account suspended" page and, if
 * that requires it, extending the resolver to expose tenant status.
 */
export const getTenantSite = cache(async (): Promise<TenantSite | null> => {
  const host = await getHost();
  if (!host) {
    return null;
  }

  try {
    return await apiGet<TenantSite>(`/public/website?domain=${encodeURIComponent(host)}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'site_not_found') {
      return null;
    }
    throw error;
  }
});
