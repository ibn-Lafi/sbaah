import type { NextRequest } from 'next/server';
import { dealInputSchema } from '@sbaah/shared';
import { okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);assertPermission(c.role,'crm.read');
 const{data,error}=await supabase.from('deals').select('*,deal_assets(asset_id)').eq('tenant_id',c.tenantId).order('created_at',{ascending:false});
 if(error)throw new Error(error.message);return okResponse({deals:data??[]});
});
export const POST=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);assertPermission(c.role,'crm.create');
 const i=dealInputSchema.parse(await r.json());const{asset_ids,...deal}=i;
 const{data,error}=await supabase.rpc('create_deal_with_assets',{p_deal:deal,p_asset_ids:asset_ids});
 if(error)throw new Error(error.message);return okResponse({deal:{...data,asset_ids}},201);
});