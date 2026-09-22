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

  const [{ data: media, error: mediaError }, { data: unitTypes, error: unitTypesError }, { data: feed, error: feedError }] = await Promise.all([
    supabase.from('project_media').select('id,url,media_type,alt_ar,alt_en,order_index').eq('tenant_id',tenantId).eq('project_id',project.id).order('order_index'),
    supabase.from('unit_types').select('id,name_ar,name_en,asset_type,specifications').eq('tenant_id',tenantId).eq('project_id',project.id),
    supabase.rpc('public_listing_feed',{p_tenant_id:tenantId,p_listing_type:null,p_asset_type:null,p_city_id:null,p_district_id:null,p_min_price:null,p_max_price:null,p_bedrooms:null,p_limit:50,p_offset:0}),
  ]);
  if(mediaError)throw new Error(mediaError.message);if(unitTypesError)throw new Error(unitTypesError.message);if(feedError)throw new Error(feedError.message);
  type FeedRow={listing_id:string;listing_number:string;listing_type:string;asking_price:number|null;asset_id:string;asset_slug:string|null;asset_type:string;asset_name_ar:string;asset_name_en:string|null;area_sqm:number|null;bedrooms:number|null;bathrooms:number|null;asset_media:unknown[]};
  const rows=(feed??[]) as FeedRow[];const assetIds=[...new Set(rows.map(row=>row.asset_id))];
  const {data:projectAssets,error:assetsError}=assetIds.length?await supabase.from('assets').select('id,project_id,unit_type_id,unit_number,floor_number').eq('tenant_id',tenantId).eq('project_id',project.id).in('id',assetIds):{data:[],error:null};
  if(assetsError)throw new Error(assetsError.message);const assetMap=new Map((projectAssets??[]).map(asset=>[asset.id,asset]));
  const units=rows.flatMap(row=>{const asset=assetMap.get(row.asset_id);if(!asset)return[];return[{id:row.asset_id,slug:row.asset_slug,unit_type_id:asset.unit_type_id,unit_number:asset.unit_number,floor_number:asset.floor_number,area_sqm:row.area_sqm,asset_type:row.asset_type,name_ar:row.asset_name_ar,name_en:row.asset_name_en,listing_id:row.listing_id,listing_number:row.listing_number,listing_type:row.listing_type,price:row.asking_price,media:row.asset_media}]});
  return okResponse({project,media:media??[],unit_types:unitTypes??[],units});
});
