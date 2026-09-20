import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { ApiError,okResponse,withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';
const schema=z.object({domain:z.string().min(1)});
interface RouteContext{params:Promise<{id:string}>}
export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
 const{id}=await params;const{domain}=schema.parse(Object.fromEntries(request.nextUrl.searchParams));const supabase=createAnonClient();
 const tenantId=await resolvePublicTenantId(domain,supabase);
 const{data,error}=await supabase.rpc('public_listing_detail',{p_tenant_id:tenantId,p_identifier:id});
 if(error)throw new Error(`Failed to load public listing: ${error.message}`);if(!data)throw new ApiError(404,'property_not_found','العقار غير موجود');
 const l=data as { id:string; listing_number:string; title_ar:string; title_en?:string|null; description_ar?:string|null; description_en?:string|null; listing_type:string; asking_price:number|null; pricing_period?:string|null; commercial_status:string; advertisement_license_number?:string|null; advertisement_license_expires_at?:string|null; advertiser_name?:string|null; assets?:Array<Record<string, unknown> & {slug?:string|null;asset_type?:string;media?:unknown[]}> };const primary=l.assets?.[0]??{};
 // Compatibility adapter: keeps the existing website contract while all data comes from the new core.
 const property={...primary,id:l.id,slug:primary.slug??l.listing_number,tenant_id:tenantId,title_ar:l.title_ar,title_en:l.title_en,
  description_ar:l.description_ar,description_en:l.description_en,property_type:primary.asset_type,listing_type:l.listing_type,
  price:l.asking_price,status:'published',property_media:primary.media??[],listing_number:l.listing_number,pricing_period:l.pricing_period,
  commercial_status:l.commercial_status,advertisement_license_number:l.advertisement_license_number,
  advertisement_license_expires_at:l.advertisement_license_expires_at,advertiser_name:l.advertiser_name,
  assets:l.assets??[]};
 return okResponse({property});
});