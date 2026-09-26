import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

interface RouteContext { params: Promise<{ id: string; mediaId: string }>; }
const updateSchema=z.object({category:z.enum(['general','exterior','entrance','living','bedrooms','kitchen','bathrooms','outdoor','amenities','parking','floor_plan','location','view','construction','other']).optional(),alt_ar:z.string().optional().nullable(),alt_en:z.string().optional().nullable(),order_index:z.number().int().nonnegative().optional(),is_primary:z.boolean().optional()}).refine(v=>Object.keys(v).length>0);

export const PATCH=withErrorHandling<RouteContext>(async(request,{params})=>{
  const{id,mediaId}=await params;const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
  if(caller.role==='agent')throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إدارة وسائط العقار');
  await assertTenantOwnedRow({supabase,table:'assets',id,tenantId:caller.tenantId,label:'العقار'});const{data:asset,error:assetError}=await supabase.from('assets').select('project_id').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();if(assetError)throw new Error(assetError.message);if(asset?.project_id)throw new ApiError(409,'project_asset_media_disabled','وسائط عقارات المشروع تُدار من معرض المشروع فقط');const input=updateSchema.parse(await request.json());
  if(input.is_primary){const{error}=await supabase.from('asset_media').update({is_primary:false}).eq('tenant_id',caller.tenantId).eq('asset_id',id).eq('is_primary',true);if(error)throw new Error(error.message);}
  const{data,error}=await supabase.from('asset_media').update(input).eq('id',mediaId).eq('asset_id',id).eq('tenant_id',caller.tenantId).select().maybeSingle();
  if(error)throw new Error(error.message);if(!data)throw new ApiError(404,'asset_media_not_found','الوسائط غير موجودة');return okResponse({media:data});
});
export const DELETE=withErrorHandling<RouteContext>(async(request,{params})=>{
  const{id,mediaId}=await params;const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
  if(caller.role==='agent')throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إدارة وسائط العقار');
  await assertTenantOwnedRow({supabase,table:'assets',id,tenantId:caller.tenantId,label:'العقار'});const{data:asset,error:assetError}=await supabase.from('assets').select('project_id').eq('id',id).eq('tenant_id',caller.tenantId).maybeSingle();if(assetError)throw new Error(assetError.message);if(asset?.project_id)throw new ApiError(409,'project_asset_media_disabled','وسائط عقارات المشروع تُدار من معرض المشروع فقط');
  const{data,error}=await supabase.from('asset_media').delete().eq('id',mediaId).eq('asset_id',id).eq('tenant_id',caller.tenantId).select('id').maybeSingle();
  if(error)throw new Error(error.message);if(!data)throw new ApiError(404,'asset_media_not_found','الوسائط غير موجودة');return okResponse({status:'deleted'});
});
