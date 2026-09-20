import type { NextRequest } from 'next/server';
import { leaseInstallmentInputSchema } from '@sbaah/shared';
import { ApiError,okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

export const GET=withErrorHandling(async(request:NextRequest)=>{
  const{supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  let q=supabase.from('lease_installments').select('*, lease_payment_allocations(amount,payment_id,lease_payments(status))').eq('tenant_id',caller.tenantId).order('due_date');
  const id=request.nextUrl.searchParams.get('contract_id');
  if(id){
    await supabase.rpc('refresh_contract_installment_statuses',{p_contract_id:id});
    q=q.eq('contract_id',id);
  }
  const{data,error}=await q;
  if(error)throw new Error(`Failed to list installments: ${error.message}`);
  type AllocationRow={amount:number;lease_payments?:{status:string}|null};type InstallmentRow={amount:number;lease_payment_allocations?:AllocationRow[];[key:string]:unknown};
  const installments=((data??[]) as InstallmentRow[]).map((row)=>{
    const paid=(row.lease_payment_allocations??[]).filter((a)=>a.lease_payments?.status==='recorded').reduce((sum,a)=>sum+Number(a.amount),0);
    return {...row,paid_amount:paid,remaining_amount:Math.max(0,Number(row.amount)-paid)};
  });
  return okResponse({installments});
});

export const POST=withErrorHandling(async(request:NextRequest)=>{
  const{supabase}=getAuthenticatedClient(request);
  const caller=await getCallerContext(supabase);
  if(caller.role==='agent')throw new ApiError(403,'forbidden','لا يملك الوسيط صلاحية إنشاء الأقساط');
  const input=leaseInstallmentInputSchema.parse(await request.json());
  await assertTenantOwnedRow({supabase,table:'lease_contracts',id:input.contract_id,tenantId:caller.tenantId,label:'العقد'});
  const{data,error}=await supabase.from('lease_installments').insert({...input,tenant_id:caller.tenantId}).select().single();
  if(error)throw new Error(`Failed to create installment: ${error.message}`);
  return okResponse({installment:data},201);
});