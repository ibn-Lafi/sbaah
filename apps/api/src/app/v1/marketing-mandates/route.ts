import type { NextRequest } from 'next/server';
import { marketingMandateInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling, databaseWriteError } from '@/lib/http';
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
 const{data,error}=await supabase.rpc('create_marketing_mandate_with_assets',{p_mandate:mandate,p_asset_ids:asset_ids}).single();
 if(error)throw databaseWriteError(error,'Failed to create marketing mandate');
 const createdMandate = data as Record<string, unknown> | null;
 if(!createdMandate)throw new Error('Marketing mandate RPC returned no row');
 return okResponse({mandate:{...createdMandate,marketing_mandate_assets:asset_ids.map(asset_id=>({asset_id}))}},201);
});