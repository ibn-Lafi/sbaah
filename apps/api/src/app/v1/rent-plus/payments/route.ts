import type { NextRequest } from 'next/server';
import { leasePaymentInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOptionalTenantOwnedRow, assertTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  let query = supabase
    .from('lease_payments')
    .select('*, lease_payment_allocations(*)')
    .eq('tenant_id', caller.tenantId)
    .order('paid_at', { ascending: false });

  const contractId = request.nextUrl.searchParams.get('contract_id');
  if (contractId) query = query.eq('contract_id', contractId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list lease payments: ${error.message}`);

  const payments = data ?? [];
  const contractIds = [...new Set(payments.map(payment => payment.contract_id).filter(Boolean))];
  const payerIds = [...new Set(payments.map(payment => payment.payer_party_id).filter(Boolean))];

  const [contractsResult, payersResult] = await Promise.all([
    contractIds.length
      ? supabase.from('lease_contracts').select('id, contract_number').eq('tenant_id', caller.tenantId).in('id', contractIds)
      : Promise.resolve({ data: [], error: null }),
    payerIds.length
      ? supabase.from('parties').select('id, name').eq('tenant_id', caller.tenantId).in('id', payerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contractsResult.error) throw new Error(`Failed to load payment contracts: ${contractsResult.error.message}`);
  if (payersResult.error) throw new Error(`Failed to load payment payers: ${payersResult.error.message}`);

  const contracts = new Map((contractsResult.data ?? []).map(contract => [contract.id, contract]));
  const payers = new Map((payersResult.data ?? []).map(payer => [payer.id, payer]));

  return okResponse({
    payments: payments.map(payment => ({
      ...payment,
      lease_contracts: contracts.get(payment.contract_id) ?? null,
      payer: payment.payer_party_id ? payers.get(payment.payer_party_id) ?? null : null,
    })),
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية تسجيل الدفعات');

  const input = leasePaymentInputSchema.parse(await request.json());
  await assertTenantOwnedRow({ supabase, table: 'lease_contracts', id: input.contract_id, tenantId: caller.tenantId, label: 'العقد' });
  await assertOptionalTenantOwnedRow({ supabase, table: 'parties', id: input.payer_party_id, tenantId: caller.tenantId, label: 'الدافع' });

  const { allocations = [], ...payment } = input;
  if (allocations.length) {
    const ids=[...new Set(allocations.map(allocation=>allocation.installment_id))];
    const {data:installments,error:installmentsError}=await supabase.from('lease_installments').select('id,contract_id,amount').eq('tenant_id',caller.tenantId).in('id',ids);
    if(installmentsError)throw new Error(`Failed to validate payment installments: ${installmentsError.message}`);
    if((installments??[]).length!==ids.length||(installments??[]).some(installment=>installment.contract_id!==input.contract_id))throw new ApiError(400,'payment_installment_contract_mismatch','أحد الاستحقاقات لا يتبع عقد الإيجار المحدد');
    const allocated=allocations.reduce((sum,allocation)=>sum+allocation.amount,0);
    if(allocated>input.amount)throw new ApiError(400,'payment_allocation_exceeds_amount','إجمالي توزيع الدفعة يتجاوز مبلغ الدفعة');
  }
  const { data, error } = await supabase.rpc('record_lease_payment', { p_payment: payment, p_allocations: allocations }).single();
  if (error) throw new Error(`Failed to record lease payment: ${error.message}`);
  return okResponse({ payment: data }, 201);
});
