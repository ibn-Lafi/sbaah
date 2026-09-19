import type { NextRequest } from 'next/server';
import { WEBSITE_PAGE_KEYS, websiteUpdateSchema, type WebsiteSectionType } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('tenant_id', caller.tenantId)
    .maybeSingle();
  if (websiteError) {
    throw new Error(`Failed to load website: ${websiteError.message}`);
  }
  if (!website) {
    // Every tenant gets a website automatically at registration (migration
    // 0012) — a missing row here means something went wrong at creation
    // time, not a normal "not found" a client should silently handle.
    throw new Error('Website row missing for an existing tenant — check migration 0012');
  }

  // Every tenant's website has exactly 4 fixed pages (migration 0024, narrowed in 0038) —
  // returned in WEBSITE_PAGE_KEYS order (not insertion order) so محرر
  // الموقع's page tabs render in the same fixed order every time.
  const { data: pages, error: pagesError } = await supabase
    .from('website_pages')
    .select('*, website_sections(*)')
    .eq('website_id', website.id)
    .order('order_index', { foreignTable: 'website_sections' });
  if (pagesError) {
    throw new Error(`Failed to load website pages: ${pagesError.message}`);
  }

  // Home section library is reconciled lazily so existing tenants receive new
  // Classic sections without a destructive backfill. New library entries start
  // hidden and become visible only when the owner adds them in the editor.
  const homePage = pages.find((page) => page.key === 'home');
  const homeLibrary: WebsiteSectionType[] = [
    'featured_properties','latest_properties','projects_showcase','properties_by_city',
    'stats','services','faq','cta','property_request','promo_banner','free_content','gallery','video',
  ];
  if (homePage) {
    const existing = new Set(homePage.website_sections.map((section) => section.type));
    const missing = homeLibrary.filter((type) => !existing.has(type));
    if (missing.length) {
      const maxOrder = homePage.website_sections.reduce((max, section) => Math.max(max, section.order_index), -1);
      const { data: created, error: createError } = await supabase
        .from('website_sections')
        .insert(missing.map((type, index) => ({
          website_id: website.id,
          page_id: homePage.id,
          type,
          order_index: maxOrder + index + 1,
          is_visible: false,
          config: {},
        })))
        .select();
      if (createError) throw new Error(`Failed to reconcile home section library: ${createError.message}`);
      homePage.website_sections.push(...(created ?? []));
      homePage.website_sections.sort((a, b) => a.order_index - b.order_index);
    }
  }

  const orderedPages = WEBSITE_PAGE_KEYS.map((key) => pages.find((page) => page.key === key)).filter(
    (page): page is NonNullable<typeof page> => page !== undefined,
  );

  return okResponse({ website, pages: orderedPages });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = websiteUpdateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('websites')
    .update(input)
    .eq('tenant_id', caller.tenantId)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update website: ${error.message}`);
  }
  if (!data) {
    throw new Error('Website row missing for an existing tenant — check migration 0012');
  }

  return okResponse({ website: data });
});
