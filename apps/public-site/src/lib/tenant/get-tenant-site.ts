import { cache } from 'react';
import type { AccountType, Website, WebsitePageKey, WebsiteSection } from '@sbaah/shared';
import { apiGet, ApiRequestError } from '@/lib/api/client';
import { getHost } from './get-host';

export interface TenantSite {
  tenant: { id: string; name_ar: string; name_en: string; account_type: AccountType };
  /** `theme_key` (e.g. 'classic', 'modern') — resolved server-side by `api` from `theme_id`, what the theme registry looks components up by. */
  website: Omit<Website, 'id' | 'tenant_id' | 'theme_id'> & { theme_key: string };
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
 * this with the SAME `pageKey` from multiple places in the same request
 * (root layout, the home page) hits the network exactly once — both go
 * through this same cached call keyed on 'home', so neither duplicates
 * the other's fetch. A non-home page (e.g. `/projects`) necessarily costs
 * one extra request beyond the layout's own 'home' chrome fetch — a
 * deliberate, small tradeoff for keeping the layout's chrome fetch (which
 * every page needs) independent of which page is actually being visited.
 */
const fetchTenantSiteResult = cache(async (pageKey: WebsitePageKey): Promise<TenantSiteResult> => {
  const host = await getHost();
  if (!host) {
    return { status: 'not_found' };
  }

  try {
    const site = await apiGet<TenantSite>(`/public/website?domain=${encodeURIComponent(host)}&page=${pageKey}`);
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

/** For the root layout only (task 36/42) — the one place that must branch on "suspended" vs "not found" to render a different page for each. Always resolves 'home' — layout only ever needs tenant/theme chrome, never a specific page's sections. */
export async function getTenantSiteResult(): Promise<TenantSiteResult> {
  return fetchTenantSiteResult('home');
}

/**
 * The homepage's own fetch — collapses "suspended" into `null` alongside
 * "not found", same as before task 36/42: the root layout already
 * renders the suspended page and never reaches `children` in that case.
 * Shares the exact same cached call as `getTenantSiteResult()` above
 * (both pass 'home'), so a home-page visit still costs one network call
 * total, unchanged from before this file supported other pages.
 */
export async function getTenantSite(): Promise<TenantSite | null> {
  const result = await fetchTenantSiteResult('home');
  return result.status === 'active' ? result.site : null;
}

/** Same as `getTenantSite()`, for any of the site's other fixed pages (متجر الثيمات follow-up, migration 0024). */
export async function getTenantSitePage(pageKey: WebsitePageKey): Promise<TenantSite | null> {
  const result = await fetchTenantSiteResult(pageKey);
  return result.status === 'active' ? result.site : null;
}
