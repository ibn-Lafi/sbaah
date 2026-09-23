import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';
import { publicProjectSlug } from '@/lib/project/public-slug';

interface PublicProjectRow {
  id: string;
  slug: string | null;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  city_id?: string | null;
  district_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  media?: unknown[];
  total_count?: number | string | null;
}

const publicProjectsQuerySchema = z.object({
  domain: z.string().min(1, 'الدومين مطلوب'),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

/**
 * Unauthenticated — powers public-site's `/projects` page. The
 * `public_projects_feed` function (migration 0104) only returns published
 * projects of active tenants, with their media.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { domain, page, page_size } = publicProjectsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);
  const offset = (page - 1) * page_size;
  const { data, error } = await supabase.rpc('public_projects_feed', {
    p_tenant_id: tenantId,
    p_limit: page_size,
    p_offset: offset,
  });
  if (error) throw new Error(`Failed to list public projects: ${error.message}`);
  const rows = (data ?? []) as PublicProjectRow[];
  const projects = rows.map(({ total_count: _, ...project }) => ({ ...project, slug: publicProjectSlug(project) }));
  return okResponse({ projects, page, page_size, total: Number(rows[0]?.total_count ?? 0) });
});
