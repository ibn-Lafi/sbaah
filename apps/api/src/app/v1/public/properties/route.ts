import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createAnonClient } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { resolvePublicTenantId } from '@/lib/tenant/resolve-public-tenant';

const querySchema=z.object({
 domain:z.string().min(1),city_id:z.string().uuid().optional(),district_id:z.string().uuid().optional(),
 property_type:z.enum(['apartment','villa','building','land','plot','office','shop','warehouse','floor','compound','chalet','farm','parking','other']).optional(),listing_type:z.enum(['sale','rent']).optional(),
 min_price:z.coerce.number().nonnegative().optional(),max_price:z.coerce.number().nonnegative().optional(),
 bedrooms:z.coerce.number().int().nonnegative().optional(),page:z.coerce.number().int().positive().default(1),
 page_size:z.coerce.number().int().positive().max(50).default(20),
}).refine(q=>q.min_price==null||q.max_price==null||q.min_price<=q.max_price,{message:'الحد الأدنى للسعر يجب ألا يتجاوز الحد الأعلى'});

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const q=querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));const supabase=createAnonClient();
 const tenantId=await resolvePublicTenantId(q.domain,supabase);const offset=(q.page-1)*q.page_size;
 const{data,error}=await supabase.rpc('public_listing_feed',{p_tenant_id:tenantId,p_listing_type:q.listing_type??null,p_asset_type:q.property_type??null,p_city_id:q.city_id??null,p_district_id:q.district_id??null,p_min_price:q.min_price??null,p_max_price:q.max_price??null,p_bedrooms:q.bedrooms??null,p_limit:q.page_size,p_offset:offset});
 if(error)throw new Error(`Failed to list public listings: ${error.message}`);
 type PublicListingFeedRow = { listing_id:string; asset_slug?:string|null; listing_number:string; title_ar:string; title_en?:string|null; description_ar?:string|null; description_en?:string|null; asset_type:string; listing_type:string; asking_price:number|null; city_id?:string|null; district_id?:string|null; bedrooms?:number|null; bathrooms?:number|null; area_sqm?:number|null; advertisement_license_number?:string|null; advertiser_name?:string|null; created_at:string; asset_media?:unknown[]; pricing_period?:string|null; commercial_status:string; asset_id:string; total_count?:number|string|null };
 const rows=(data??[]) as PublicListingFeedRow[];
 // Temporary compatibility shape for the current public-site. Source of truth is now Listing + Asset.
 const properties=rows.map(r=>({
  id:r.listing_id,slug:r.asset_slug??r.listing_number,tenant_id:tenantId,
  title_ar:r.title_ar,title_en:r.title_en,description_ar:r.description_ar,description_en:r.description_en,
  property_type:r.asset_type,listing_type:r.listing_type,price:r.asking_price,
  city_id:r.city_id,district_id:r.district_id,bedrooms:r.bedrooms,bathrooms:r.bathrooms,area_sqm:r.area_sqm,
  status:'published',advertisement_license_number:r.advertisement_license_number,
  advertiser_name:r.advertiser_name,created_at:r.created_at,
  property_media:r.asset_media??[],listing_number:r.listing_number,pricing_period:r.pricing_period,
  commercial_status:r.commercial_status,asset_id:r.asset_id
 }));
 return okResponse({properties,page:q.page,page_size:q.page_size,total:Number(rows[0]?.total_count??0)});
});