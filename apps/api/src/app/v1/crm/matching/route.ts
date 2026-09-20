import type { NextRequest } from 'next/server';
import { okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.read');
 const leadId=r.nextUrl.searchParams.get('lead_id');if(!leadId)throw new Error('lead_id is required');
 await assertTenantOwnedRow({supabase,table:'leads',id:leadId,tenantId:c.tenantId,label:'العميل'});if(isAssignedScope(grant))await assertAssignedLeadAccess(supabase,c.tenantId,c.userId,leadId);
 const{data:req,error:reqError}=await supabase.from('lead_requirements').select('*').eq('tenant_id',c.tenantId).eq('lead_id',leadId).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(reqError)throw new Error(reqError.message);if(!req)return okResponse({matches:[]});
 let q=supabase.from('listings').select('id,title_ar,asking_price,listing_type,listing_assets!inner(asset:assets!inner(id,asset_type,area_sqm,bedrooms,city_id,district_id,archived_at))').eq('tenant_id',c.tenantId).eq('publication_status','published').neq('commercial_status','closed').is('listing_assets.asset.archived_at',null);
 if(req.purpose_v2)q=q.eq('listing_type',req.purpose_v2);if(req.budget_min!=null)q=q.gte('asking_price',req.budget_min);if(req.budget_max!=null)q=q.lte('asking_price',req.budget_max);
 const{data,error}=await q.limit(50);if(error)throw new Error(error.message);
 const matches=(data??[]).flatMap((l:any)=>(l.listing_assets??[]).map((x:any)=>({id:x.asset.id,listing_id:l.id,title_ar:l.title_ar,price:l.asking_price,area_sqm:x.asset.area_sqm,bedrooms:x.asset.bedrooms,asset_type:x.asset.asset_type,city_id:x.asset.city_id,district_id:x.asset.district_id}))).filter((m:any)=>(req.area_min==null||m.area_sqm>=req.area_min)&&(req.area_max==null||m.area_sqm<=req.area_max)&&(req.bedrooms_min==null||m.bedrooms>=req.bedrooms_min)&&(!req.asset_types?.length||req.asset_types.includes(m.asset_type))&&(!req.city_ids?.length||req.city_ids.includes(m.city_id))&&(!req.district_ids?.length||req.district_ids.includes(m.district_id)));
 return okResponse({matches});
});