import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient, createServiceRoleClient, WEBSITE_PAGE_KEYS } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantChrome } from '@/lib/tenant/resolve-public-tenant';

const publicWebsiteQuerySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
  /** Which of the tenant's 4 fixed pages (migration 0024, narrowed in 0038) to return sections for — defaults to the homepage. */
  page: z.enum(WEBSITE_PAGE_KEYS).default('home'),
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
  const { domain, page: pageKey } = publicWebsiteQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const chrome = await resolvePublicTenantChrome(domain, supabase);
  if (!chrome) {
    throw new ApiError(404, 'site_not_found', 'الموقع غير موجود');
  }
  const trialExpired = chrome.trial_ends_at !== null && new Date(chrome.trial_ends_at) <= new Date();
  if (chrome.status !== 'active' || trialExpired) {
    throw new ApiError(403, 'tenant_suspended', 'الحساب غير متاح حاليًا');
  }
  // مطلوب مؤسس (migration 0047): الموقع العام لا يُنشر لحين إكمال بيانات
  // الحساب — فال لأي نوع، والسجل التجاري/الرقم الضريبي أيضًا لمؤسسة/شركة.
  // resolve_public_tenant (properties/leads) يفرض هذا فعليًا بجملة SQL؛
  // هنا (resolve_public_tenant_chrome لا يفلتر عمدًا) لا بد من نفس الفحص
  // صراحة، لعرض رسالة مختلفة عن "الحساب موقوف".
  const profileComplete =
    chrome.fal_license_number !== null &&
    (chrome.account_type === 'individual' || (chrome.cr_number !== null && chrome.tax_number !== null));
  if (!profileComplete) {
    throw new ApiError(403, 'profile_incomplete', 'الموقع غير منشور بعد');
  }
  const tenantId = chrome.id;
  const tenant = {
    name_ar: chrome.name_ar,
    name_en: chrome.name_en,
    account_type: chrome.account_type,
    cr_number: chrome.cr_number,
    tax_number: chrome.tax_number,
    fal_license_number: chrome.fal_license_number,
    social_instagram: chrome.social_instagram,
    social_tiktok: chrome.social_tiktok,
    social_whatsapp: chrome.social_whatsapp,
    social_snapchat: chrome.social_snapchat,
    social_phone: chrome.social_phone,
    // A verified custom domain is the canonical URL going forward — the
    // subdomain redirects to this once verified (see public-site's
    // [locale]/layout.tsx), matching standard SaaS custom-domain practice
    // (Shopify, Webflow, etc.): a single canonical domain avoids duplicate-
    // content SEO penalties and keeps a paid custom domain from being
    // silently overshadowed by the default subdomain. Both null when unset
    // or still pending DNS/certificate verification.
    custom_domain: chrome.custom_domain_status === 'verified' ? chrome.custom_domain : null,
  };

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select(
      'id, theme_id, primary_color, secondary_color, font_family, logo_url, banner_image_url, banner_video_url, announcement_bar_text, footer_description, address',
    )
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

  const { data: page, error: pageError } = await supabase
    .from('website_pages')
    .select('id')
    .eq('website_id', websiteId)
    .eq('key', pageKey)
    .single();
  if (pageError || !page) {
    throw new Error(`Failed to load website page '${pageKey}': ${pageError?.message}`);
  }

  const { data: sections, error: sectionsError } = await supabase
    .from('website_sections')
    .select('id, type, order_index, config')
    .eq('page_id', page.id)
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
  const { data: analyticsIntegration, error: analyticsError } = await serviceRole
    .from('tenant_integrations')
    .select('measurement_id')
    .eq('tenant_id', tenantId)
    .eq('provider', 'google_analytics')
    .in('status', ['installed', 'connected'])
    .maybeSingle();
  if (analyticsError) {
    throw new Error(`Failed to load public analytics config: ${analyticsError.message}`);
  }

  const { data: owner, error: ownerError } = await serviceRole
    .from('users')
    .select('phone')
    .eq('tenant_id', tenantId)
    .eq('role', 'owner')
    .single();
  if (ownerError || !owner) {
    throw new Error(`Failed to load public tenant WhatsApp contact: ${ownerError?.message}`);
  }

  // الصفحات (footer links) — title + slug only; a page's full content is
  // fetched separately (GET /v1/public/website/pages/[slug]) only when a
  // visitor actually opens it.
  const { data: customPages, error: customPagesError } = await supabase
    .from('website_custom_pages')
    .select('id, title, slug')
    .eq('website_id', websiteId)
    .order('order_index', { ascending: true });
  if (customPagesError) {
    throw new Error(`Failed to load custom pages: ${customPagesError.message}`);
  }

  return okResponse({ tenant, website: websiteConfig, sections, whatsapp_phone: owner.phone, custom_pages: customPages, google_analytics_measurement_id: analyticsIntegration?.measurement_id ?? null });
});
