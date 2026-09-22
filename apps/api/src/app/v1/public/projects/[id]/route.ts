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

  const { data: project, error: projectError } = await supabase.from('projects')
    .select('id,slug,name_ar,name_en,description_ar,description_en,city_id,district_id,lat,lng')
    .eq('tenant_id',tenantId).eq('status','published').or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
  if(projectError)throw new Error(`Failed to load public project: ${projectError.message}`);
  if(!project)throw new ApiError(404,'project_not_found','المشروع غير موجود');

  const [{data:media,error:mediaError},{data:unitTypes,error:unitTypesError},{data:feed,error:feedError}]=await Promise.all([
    supabase.from('project_media').select('id,url,media_type,alt_ar,alt_en,order_index').eq('tenant_id',tenantId).eq('project_id',project.id).order('order_index'),
    supabase.from('unit_types').select('id,name_ar,name_en,asset_type,specifications').eq('tenant_id',tenantId).eq('project_id',project.id),
    supabase.rpc('public_project_listing_feed',{p_tenant_id:tenantId,p_project_id:project.id,p_limit:100,p_offset:0}),
  ]);
  if(mediaError)throw new Error(`Failed to load public project media: ${mediaError.message}`);
  if(unitTypesError)throw new Error(`Failed to load public project unit types: ${unitTypesError.message}`);
  if(feedError)throw new Error(`Failed to load public project inventory: ${feedError.message}`);
  const rows=feed??[];
  const units=rows.map(row=>({id:row.asset_id,slug:row.asset_slug,unit_type_id:row.unit_type_id,phase_id:row.phase_id,unit_number:row.unit_number,floor_number:row.floor_number,area_sqm:row.area_sqm,bedrooms:row.bedrooms,bathrooms:row.bathrooms,asset_type:row.asset_type,name_ar:row.asset_name_ar,name_en:row.asset_name_en,listing_id:row.listing_id,listing_number:row.listing_number,listing_type:row.listing_type,price:row.asking_price,pricing_period:row.pricing_period,commercial_status:row.commercial_status,media:row.asset_media}));
  return okResponse({project,media:media??[],unit_types:unitTypes??[],units,total:Number(rows[0]?.total_count??0)});
});
