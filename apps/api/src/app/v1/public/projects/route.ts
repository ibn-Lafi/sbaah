import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const publicProjectsQuerySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * Unauthenticated — powers public-site's `/projects` page (متجر الثيمات
 * follow-up, migration 0024's multi-page websites). `projects_public_select`
 * (RLS, migration 0009) already restricts anon to `status='published'`
 * rows of active tenants; `tenant_id`/`status` are stated explicitly here
 * too anyway, same convention as GET /v1/public/properties.
 *
 * No `project_media` table exists yet (projects were never built with an
 * image gallery, task 13/42) — this returns text fields only. A public
 * projects page without photos is a real, known limitation, not an
 * oversight; adding project images is separate future work.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain, page, page_size } = publicProjectsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);

  const from = (page - 1) * page_size;
  const { data, error, count } = await supabase
    .from('projects')
    .select('id, name_ar, name_en, description_ar, description_en, city_id, district_id', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list public projects: ${error.message}`);
  }

  return okResponse({ projects: data, page, page_size, total: count ?? 0 });
});
