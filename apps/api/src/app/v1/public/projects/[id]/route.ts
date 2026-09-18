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

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .or(`id.eq.${id},slug.eq.${id}`)
    .maybeSingle();

  if (projectError) throw new Error(`Failed to load public project: ${projectError.message}`);
  if (!project) throw new ApiError(404, 'project_not_found', 'المشروع غير موجود');

  const [{ data: media, error: mediaError }, { data: unitTypes, error: unitTypesError }, { data: units, error: unitsError }] =
    await Promise.all([
      supabase.from('project_media').select('id,url,media_type,alt_ar,alt_en,order_index').eq('tenant_id', tenantId).eq('project_id', project.id).order('order_index'),
      supabase.from('unit_types').select('*').eq('tenant_id', tenantId).eq('project_id', project.id),
      supabase.from('units').select('id,unit_type_id,unit_number,floor_number,area_sqm,price,orientation,availability').eq('tenant_id', tenantId).eq('project_id', project.id).eq('availability', 'available'),
    ]);

  if (mediaError) throw new Error(mediaError.message);
  if (unitTypesError) throw new Error(unitTypesError.message);
  if (unitsError) throw new Error(unitsError.message);

  return okResponse({ project, media: media ?? [], unit_types: unitTypes ?? [], units: units ?? [] });
});
