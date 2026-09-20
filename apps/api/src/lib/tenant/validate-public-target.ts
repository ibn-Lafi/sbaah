import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

export async function validatePublicTenantTarget(
 anon:SupabaseClient,tenantId:string,listingId?:string|null,assetId?:string|null,
):Promise<void>{
 if(listingId||assetId){
  const identifier=listingId??assetId!;
  const{data,error}=await anon.rpc('public_listing_detail',{p_tenant_id:tenantId,p_identifier:identifier});
  if(error)throw new Error(`Failed to validate public listing target: ${error.message}`);
  if(!data)throw new ApiError(404,'property_not_found','العقار غير موجود');
  if(assetId){
   const assets=(data as {assets?:Array<{asset_id?:string}>}).assets??[];
   if(!assets.some(a=>a.asset_id===assetId))throw new ApiError(404,'property_not_found','العقار غير موجود');
  }
  return;
 }
 const{data:isActive,error}=await anon.rpc('is_tenant_active',{check_tenant_id:tenantId});
 if(error)throw new Error(`Failed to validate tenant target: ${error.message}`);
 if(!isActive)throw new ApiError(404,'tenant_not_found','الحساب غير موجود');
}