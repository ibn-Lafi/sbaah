import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantChrome } from '@/lib/tenant/resolve-public-tenant';

const publicCustomPageQuerySchema = z.object({ domain: z.string().min(1, 'الدومين مطلوب') });

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * A single owner-authored page (الصفحات) by slug — kept separate from
 * `GET /v1/public/website` (task 32/42) since page content can be long
 * and every other page-render only needs the title+slug list for footer
 * links, not full content of every page on every request.
 */
export const GET = withErrorHandling<RouteContext>(async (request: NextRequest, { params }) => {
  const { slug } = await params;
  const { domain } = publicCustomPageQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const chrome = await resolvePublicTenantChrome(domain, supabase);
  if (!chrome || chrome.status !== 'active') {
    throw new ApiError(404, 'site_not_found', 'الموقع غير موجود');
  }

  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('id')
    .eq('tenant_id', chrome.id)
    .single();
  if (websiteError || !website) {
    throw new Error(`Failed to load public website: ${websiteError?.message}`);
  }

  const { data: page, error: pageError } = await supabase
    .from('website_custom_pages')
    .select('title, content')
    .eq('website_id', website.id)
    .eq('slug', slug)
    .maybeSingle();
  if (pageError) {
    throw new Error(`Failed to load custom page: ${pageError.message}`);
  }
  if (!page) {
    throw new ApiError(404, 'page_not_found', 'الصفحة غير موجودة');
  }

  return okResponse({ page });
});
