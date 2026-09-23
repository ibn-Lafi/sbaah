import type { AssetType, ListingType, MediaType } from '@sbaah/shared';
import { apiGet, ApiRequestError } from './client';
import { getHost } from '@/lib/tenant/get-host';

export interface PublicPropertyMedia { id?:string; url:string; media_type:MediaType; order_index:number; }
export interface PublicProperty {
  id:string; asset_id:string; slug:string|null; tenant_id:string;
  project_id:string|null; title_ar:string; title_en:string|null;
  description_ar:string|null; description_en:string|null;
  property_type:AssetType; listing_type:ListingType; price:number;
  area_sqm:number|null; bedrooms:number|null; bathrooms:number|null;
  city_id:string|null; district_id:string|null; lat:number|null; lng:number|null;
  status:'published'; listing_number:string; pricing_period:string|null;
  commercial_status:string; property_media:PublicPropertyMedia[];
}
export type PublicPropertyDetail = PublicProperty;

export interface PublicPropertyListResponse { properties:PublicProperty[]; page:number; page_size:number; total:number; }
export interface PublicPropertySearchFilters { city_id?:string; district_id?:string; property_type?:string; listing_type?:string; min_price?:number; max_price?:number; bedrooms?:number; page?:number; page_size?:number; }

export async function listPublicProperties(filters:PublicPropertySearchFilters):Promise<PublicPropertyListResponse>{
  const host=await getHost(); const query=new URLSearchParams({domain:host??''});
  if(filters.city_id)query.set('city_id',filters.city_id); if(filters.district_id)query.set('district_id',filters.district_id);
  if(filters.property_type)query.set('property_type',filters.property_type); if(filters.listing_type)query.set('listing_type',filters.listing_type);
  if(filters.min_price!==undefined)query.set('min_price',String(filters.min_price)); if(filters.max_price!==undefined)query.set('max_price',String(filters.max_price));
  if(filters.bedrooms!==undefined)query.set('bedrooms',String(filters.bedrooms)); if(filters.page)query.set('page',String(filters.page)); if(filters.page_size)query.set('page_size',String(filters.page_size));
  return apiGet<PublicPropertyListResponse>(`/public/properties?${query.toString()}`);
}
export async function getPublicProperty(id:string):Promise<PublicPropertyDetail|null>{
  const host=await getHost();
  try { const {property}=await apiGet<{property:PublicPropertyDetail}>(`/public/properties/${id}?domain=${encodeURIComponent(host??'')}`); return property; }
  catch(error){ if(error instanceof ApiRequestError&&error.code==='property_not_found')return null; throw error; }
}
