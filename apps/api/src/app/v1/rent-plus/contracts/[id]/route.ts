import { z } from 'zod';
import { LEASE_CONTRACT_STATUSES } from '@sbaah/shared';
import { ApiError,okResponse,withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

const updateSchema=z.object({status:z.enum(LEASE_CONTRACT_STATUSES).optional(),signed_at:z.string().datetime().optional().nullable(),termination_reason:z.string().optional().nullable(),notes:z.string().optional().nullable()});
interface RouteContext{params:Promise<{id:string}>}

export const GET=withErrorHandling<RouteContext>(async(request,{params})=>{
 const{id}=await params;const{supabase}=getAuthenticatedClient(request);
 await supabase.rpc('refresh_contract_installment_statuses',{p_contract_id:id});
 const{data,error}=await supabase.from('lease_contracts').select('*, lease_contract_assets(asset_id,assets(*)), lease_contract_parties(party_id,role,parties(*)), lease_installments(*,lease_payment_allocations(amount,payment_id,lease_payments(status)))').eq('id',id).maybeSingle();
 if(error)throw new Error(`Failed to load lease contract: ${error.message}`);if(!data)throw new ApiError(404,'lease_contract_not_found','عقد الإيجار غير موجود');
 const{data:payments,error:paymentError}=await supabase.from('lease_payments').select('*,lease_payment_allocations(*)').eq('contract_id',id).order('paid_at',{ascending:false});if(paymentError)throw new Error(`Failed to load contract payments: ${paymentError.message}`);
 type AllocationRow={amount:number;lease_payments?:{status:string}|null};type InstallmentRow={amount:number;lease_payment_allocations?:AllocationRow[];[key:string]:unknown};type PaymentRow={amount:number;status:string;[key:string]:unknown};
 const installments=((data.lease_installments??[]) as InstallmentRow[]).map((row)=>{const paid=(row.lease_payment_allocations??[]).filter((a)=>a.lease_payments?.status==='recorded').reduce((s,a)=>s+Number(a.amount),0);return{...row,paid_amount:paid,remaining_amount:Math.max(0,Number(row.amount)-paid)}});
 const totalPaid=((payments??[]) as PaymentRow[]).filter((p)=>p.status==='recorded').reduce((s,p)=>s+Number(p.amount),0);
 return okResponse({contract:{...data,lease_installments:installments,payments:payments??[],financial_summary:{contract_value:Number(data.total_value),paid_amount:totalPaid,remaining_amount:Math.max(0,Number(data.total_value)-totalPaid)}}});
});

export const PATCH=withErrorHandling<RouteContext>(async(request,{params})=>{const{id}=await params;const{supabase}=getAuthenticatedClient(request);const input=updateSchema.parse(await request.json());const payload={...input,...(input.status==='terminated'?{terminated_at:new Date().toISOString()}: {})};const{data,error}=await supabase.from('lease_contracts').update(payload).eq('id',id).select().maybeSingle();if(error)throw new Error(`Failed to update lease contract: ${error.message}`);if(!data)throw new ApiError(404,'lease_contract_not_found','عقد الإيجار غير موجود');return okResponse({contract:data});});