import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient, createServiceRoleClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantChrome } from '@/lib/tenant/resolve-public-tenant';

const publicWebsiteQuerySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
});

/**
 * `public-site`'s single per-request fetch (task 32/42) — tenant chrome
 * (name/account type for the سبعة badge color, task 35/42) + theme
 * (colors/font/logo/banner) + the visible section list + the Owner's
 * WhatsApp contact number (task 34/42), all in one call since a full
 * page render always needs all of it together.
 *
 * `resolvePublicTenantChrome` (task 36/42) both resolves the domain AND
 * tells "no such domain" (404) apart from "domain matches a
 * suspended/cancelled tenant" (403 tenant_suspended, PRODUCT_SPEC
 * section 2's "غير متاح حاليًا" page) — the whole reason it exists
 * instead of reusing `resolvePublicTenantId`, which only ever resolves
 * active tenants.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain } = publicWebsiteQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const chrome = await resolvePublicTenantChrome(domain, supabase);
  if (!chrome) {
    throw new ApiError(404, 'site_not_found', 'الموقع غير موجود');
  }
  if (chrome.status !== 'active') {
    throw new ApiError(403, 'tenant_suspended', 'الحساب غير متاح حاليًا');
  }
  const tenantId = chrome.id;
  const tenant = { name_ar: chrome.name_ar, name_en: chrome.name_en, account_type: chrome.account_type };

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id, theme_id, primary_color, secondary_color, font_family, logo_url, banner_image_url')
    .eq('tenant_id', tenantId)
    .single();
  if (websiteError || !website) {
    throw new Error(`Failed to load public website config: ${websiteError?.message}`);
  }

  // Resolves the theme's stable code-reference `key` (e.g. 'classic') from
  // its uuid — public-site's theme registry (apps/public-site/src/components/themes)
  // looks components up by `key`, never by the row's `id`.
  const { data: theme, error: themeError } = await supabase.from('themes').select('key').eq('id', website.theme_id).single();
  if (themeError || !theme) {
    throw new Error(`Failed to load website theme: ${themeError?.message}`);
  }

  // websites_public_select/website_sections_public_select (RLS,
  // migration 0005) already restrict both to active tenants and visible
  // sections — re-stated explicitly per PRODUCT_SPEC section 10
  // ("فلترة صريحة داخل api قبل أي استعلام"), same as every other public
  // endpoint, not relied on as the only guard.
  const { id: websiteId, theme_id: _themeId, ...websiteConfig } = { ...website, theme_key: theme.key };
  const { data: sections, error: sectionsError } = await supabase
    .from('website_sections')
    .select('id, type, order_index, config')
    .eq('website_id', websiteId)
    .eq('is_visible', true)
    .order('order_index', { ascending: true });
  if (sectionsError) {
    throw new Error(`Failed to load public website sections: ${sectionsError.message}`);
  }

  // `users` has no anon SELECT policy at all (migration 0005 — phone
  // numbers aren't generally queryable), so the one legitimate public
  // use of a phone number here (the WhatsApp click-to-chat button,
  // task 34/42) goes through the service role deliberately, scoped to
  // exactly the Owner's phone and nothing else on the row.
  const serviceRole = createServiceRoleClient();
  const { data: owner, error: ownerError } = await serviceRole
    .from('users')
    .select('phone')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .single();
  if (ownerError || !owner) {
    throw new Error(`Failed to load public tenant WhatsApp contact: ${ownerError?.message}`);
  }

  return okResponse({ tenant, website: websiteConfig, sections, whatsapp_phone: owner.phone });
});
