import type { NextRequest } from 'next/server';
import { createAnonClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';
import { publicProjectSlug } from '@/lib/project/public-slug';

export const GET = withErrorHandling(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const domain = request.nextUrl.searchParams.get('domain');
    if (!domain) throw new ApiError(400, 'domain_required', 'الدومين مطلوب');
    const supabase = createAnonClient();
    const tenantId = await resolvePublicTenantId(domain, supabase);
    const { data, error } = await supabase.rpc('public_project_detail', {
      p_tenant_id: tenantId,
      p_identifier: id,
    });
    if (error) throw new Error(`Failed to load public project: ${error.message}`);
    if (!data) throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
    const detail = data as {
      project: Record<string, unknown> & { id: string; slug: string | null };
      media?: unknown[];
      unit_types?: unknown[];
      properties?: Array<Record<string, unknown> & { units?: unknown[] }>;
      units?: unknown[];
    };
    const properties = detail.properties ?? [];
    return okResponse({
      project: { ...detail.project, slug: publicProjectSlug(detail.project) },
      media: detail.media ?? [],
      unit_types: detail.unit_types ?? [],
      properties,
      units: detail.units ?? [],
      properties_total: properties.length,
      nested_units_total: properties.reduce(
        (total, property) => total + (property.units?.length ?? 0),
        0,
      ),
      total: detail.units?.length ?? 0,
    });
  },
);
