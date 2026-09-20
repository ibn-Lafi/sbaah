import type { NextRequest } from 'next/server';
import { dealInputSchema } from '@sbaah/shared';
import { ApiError,okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { assertAssignedLeadAccess, isAssignedScope } from '@/lib/auth/crm-scope';

export const GET=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.read');
 let query=supabase.from('deals').select('*,deal_assets(asset_id)').eq('tenant_id',c.tenantId);if(isAssignedScope(grant))query=query.eq('responsible_user_id',c.userId);
 const{data,error}=await query.order('created_at',{ascending:false});
 if(error)throw new Error(error.message);return okResponse({deals:data??[]});
});
export const POST=withErrorHandling(async(r:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(r);const c=await getCallerContext(supabase);const grant=assertPermission(c.role,'crm.create');
 const i=dealInputSchema.parse(await r.json());if(isAssignedScope(grant)){await assertAssignedLeadAccess(supabase,c.tenantId,c.userId,i.lead_id);if(i.responsible_user_id&&i.responsible_user_id!==c.userId)throw new ApiError(403,'forbidden_scope','لا يمكنك إنشاء صفقة لمستخدم آخر');}const{asset_ids,...rawDeal}=i;const deal=isAssignedScope(grant)?{...rawDeal,responsible_user_id:c.userId}:rawDeal;
 const{data,error}=await supabase.rpc('create_deal_with_assets',{p_deal:deal,p_asset_ids:asset_ids}).single();
 if(error)throw new Error(error.message);return okResponse({deal:{...data,asset_ids}},201);
});