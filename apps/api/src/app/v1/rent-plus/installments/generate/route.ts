import { z } from 'zod';
import { ApiError, okResponse, withErrorHandling, databaseWriteError } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

const schema=z.object({contract_id:z.string().uuid()});

export const POST=withErrorHandling(async(request)=>{
  const {supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  if(caller.role==='agent')throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إنشاء جدول الاستحقاقات');
  const {contract_id}=schema.parse(await request.json());
  await assertTenantOwnedRow({supabase,table:'lease_contracts',id:contract_id,tenantId:caller.tenantId,label:'العقد'});
  const {data,error}=await supabase.rpc('generate_lease_installments',{p_contract_id:contract_id});
  if(error) throw databaseWriteError(error,'Failed to generate lease installments');
  return okResponse({installments:data},201);
});
