import { cache } from 'react';
import type { AccountType, Website, WebsiteSection } from '@sbaah/shared';
import { apiGet, ApiRequestError } from '@/lib/api/client';
import { getHost } from './get-host';

export interface TenantSite {
  tenant: { id: string; name_ar: string; name_en: string; account_type: AccountType };
  website: Omit<Website, 'id' | 'tenant_id' | 'theme_id'>;
  sections: Pick<WebsiteSection, 'id' | 'type' | 'order_index' | 'config'>[];
  /** The tenant Owner's phone (task 34/42's WhatsApp click-to-chat button) — `users` has no anon SELECT policy, so `api` resolves this server-side, never queried directly from here. */
  whatsapp_phone: string;
}

export type TenantSiteResult =
  | { status: 'not_found' }
  /** PRODUCT_SPEC section 2 — a suspended/cancelled tenant's domain still resolves, but the whole site must show "غير متاح حاليًا" instead of a plain 404 (task 36/42). Deliberately carries no tenant name/branding — a generic message, not a personalized one, keeps a random visitor from learning anything about *why* or *whose* account this is. */
  | { status: 'suspended' }
  | { status: 'active'; site: TenantSite };

/**
 * The one server-side fetch every page/layout in this app needs — reads
 * the incoming `Host` header (how a visitor's browser identifies "whose
 * site is this", PRODUCT_SPEC section 7) and resolves it via `api`.
 * Wrapped in React's `cache()` (request-scoped memoization) so calling
 * this from multiple places in the same request (root layout, a page)
 * hits the network exactly once — `getTenantSite()` below and
 * `getTenantSiteResult()` both go through this same cached call, so
 * neither duplicates the other's fetch.
 */
const fetchTenantSiteResult = cache(async (): Promise<TenantSiteResult> => {
  const host = await getHost();
  if (!host) {
    return { status: 'not_found' };
  }

  try {
    const site = await apiGet<TenantSite>(`/public/website?domain=${encodeURIComponent(host)}`);
    return { status: 'active', site };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'site_not_found') {
      return { status: 'not_found' };
    }
    if (error instanceof ApiRequestError && error.code === 'tenant_suspended') {
      return { status: 'suspended' };
    }
    throw error;
  }
});

/** For the root layout only (task 36/42) — the one place that must branch on "suspended" vs "not found" to render a different page for each. */
export async function getTenantSiteResult(): Promise<TenantSiteResult> {
  return fetchTenantSiteResult();
}

/**
 * For every other caller (property pages, sections) — collapses
 * "suspended" into `null` alongside "not found", same as before task
 * 36/42: the root layout already renders the suspended page and never
 * reaches these callers' `children` in that case, so they never
 * actually need to distinguish the two.
 */
export async function getTenantSite(): Promise<TenantSite | null> {
  const result = await fetchTenantSiteResult();
  return result.status === 'active' ? result.site : null;
}
