import type { NextRequest } from 'next/server';
import { createAnonClient } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

export const GET = withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const domain = request.nextUrl.searchParams.get('domain');
  if (!domain) throw new ApiError(400, 'domain_required', 'الدومين مطلوب');
  const supabase = createAnonClient();
  const tenantId = await resolvePublicTenantId(domain, supabase);
  const { data, error } = await supabase.rpc('public_project_detail', { p_tenant_id: tenantId, p_identifier: id });
  if (error) throw new Error(`Failed to load public project: ${error.message}`);
  if (!data) throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');
  const detail = data as { project:Record<string,unknown>;media?:unknown[];unit_types?:unknown[];units?:unknown[] };
  return okResponse({ project:detail.project, media:detail.media??[], unit_types:detail.unit_types??[], units:detail.units??[], total:detail.units?.length??0 });
});
