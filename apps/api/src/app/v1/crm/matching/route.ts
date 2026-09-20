import type { NextRequest } from 'next/server';
import { okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

type ListingAssetRef = { asset_id: string };
type MatchingListing = { id: string; title_ar: string; asking_price: number | null; listing_type: string; listing_assets: ListingAssetRef[] | null };
type MatchingAsset = { id: string; asset_type: string; area_sqm: number | null; bedrooms: number | null; city_id: string | null; district_id: string | null };

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.read');
 const leadId=r.nextUrl.searchParams.get('lead_id');if(!leadId)throw new Error('lead_id is required');
 await assertTenantOwnedRow({supabase,table:'leads',id:leadId,tenantId:c.tenantId,label:'العميل'});if(isAssignedScope(grant))await assertAssignedLeadAccess(supabase,c.tenantId,c.userId,leadId);
 const{data:req,error:reqError}=await supabase.from('lead_requirements').select('*').eq('tenant_id',c.tenantId).eq('lead_id',leadId).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(reqError)throw new Error(reqError.message);if(!req)return okResponse({matches:[]});
 let q=supabase.from('listings').select('id,title_ar,asking_price,listing_type,listing_assets(asset_id)').eq('tenant_id',c.tenantId).eq('publication_status','published').neq('commercial_status','closed');
 if(req.purpose_v2)q=q.eq('listing_type',req.purpose_v2);if(req.budget_min!=null)q=q.gte('asking_price',req.budget_min);if(req.budget_max!=null)q=q.lte('asking_price',req.budget_max);
 const{data:listings,error}=await q.limit(50);if(error)throw new Error(error.message);
 const typedListings=(listings??[]) as MatchingListing[];const assetIds=[...new Set(typedListings.flatMap((l)=>(l.listing_assets??[]).map((x)=>x.asset_id)))];
 if(assetIds.length===0)return okResponse({matches:[]});
 let assetsQuery=supabase.from('assets').select('id,asset_type,area_sqm,bedrooms,city_id,district_id').eq('tenant_id',c.tenantId).in('id',assetIds).is('archived_at',null);
 if(req.area_min!=null)assetsQuery=assetsQuery.gte('area_sqm',req.area_min);if(req.area_max!=null)assetsQuery=assetsQuery.lte('area_sqm',req.area_max);if(req.bedrooms_min!=null)assetsQuery=assetsQuery.gte('bedrooms',req.bedrooms_min);
 if(req.asset_types?.length)assetsQuery=assetsQuery.in('asset_type',req.asset_types);if(req.city_ids?.length)assetsQuery=assetsQuery.in('city_id',req.city_ids);if(req.district_ids?.length)assetsQuery=assetsQuery.in('district_id',req.district_ids);
 const{data:assets,error:assetsError}=await assetsQuery;if(assetsError)throw new Error(assetsError.message);
 const assetMap=new Map(((assets??[]) as MatchingAsset[]).map((a)=>[a.id,a]));
 const matches=typedListings.flatMap((l)=>(l.listing_assets??[]).map((x)=>{const a=assetMap.get(x.asset_id);return a?{id:a.id,listing_id:l.id,title_ar:l.title_ar,price:l.asking_price,area_sqm:a.area_sqm,bedrooms:a.bedrooms,asset_type:a.asset_type,city_id:a.city_id,district_id:a.district_id}:null;})).filter((match): match is NonNullable<typeof match> => match !== null);
 return okResponse({matches});
});