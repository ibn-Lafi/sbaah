import type { NextRequest } from 'next/server';
import { marketingMandateInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOptionalTenantOwnedRow, assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

export const GET=withErrorHandling(async(request:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
 let query=supabase.from('marketing_mandates').select('*,marketing_mandate_assets(asset_id)').eq('tenant_id',caller.tenantId);
 const status=request.nextUrl.searchParams.get('status');if(status)query=query.eq('status',status);
 const{data,error}=await query.order('created_at',{ascending:false});if(error)throw new Error(error.message);
 return okResponse({mandates:data??[]});
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
 const{supabase}=getAuthenticatedClient(request);const caller=await getCallerContext(supabase);
 if(caller.role==='agent')throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إنشاء تفويضات التسويق');
 const input=marketingMandateInputSchema.parse(await request.json());
 await assertOptionalTenantOwnedRow({supabase,table:'parties',id:input.owner_party_id,tenantId:caller.tenantId,label:'المالك'});
 for(const assetId of input.asset_ids)await assertTenantOwnedRow({supabase,table:'assets',id:assetId,tenantId:caller.tenantId,label:'العقار'});
 const{asset_ids,...mandate}=input;
 const{data,error}=await supabase.from('marketing_mandates').insert({...mandate,tenant_id:caller.tenantId}).select().single();if(error)throw new Error(error.message);
 const{error:linkError}=await supabase.from('marketing_mandate_assets').insert(asset_ids.map(asset_id=>({tenant_id:caller.tenantId,marketing_mandate_id:data.id,asset_id})));
 if(linkError){await supabase.from('marketing_mandates').delete().eq('id',data.id).eq('tenant_id',caller.tenantId);throw new Error(linkError.message);}
 return okResponse({mandate:{...data,marketing_mandate_assets:asset_ids.map(asset_id=>({asset_id}))}},201);
});