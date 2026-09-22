import type { NextRequest } from 'next/server';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const GET = withErrorHandling(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data: party, error: partyError } = await supabase
    .from('parties')
    .select('*')
    .eq('tenant_id', caller.tenantId)
    .eq('id', id)
    .maybeSingle();
  if (partyError) throw new Error(`Failed to load tenant: ${partyError.message}`);
  if (!party) throw new ApiError(404, 'tenant_not_found', 'المستأجر غير موجود');

  const { data: links, error: linksError } = await supabase
    .from('lease_contract_parties')
    .select('contract_id, role')
    .eq('tenant_id', caller.tenantId)
    .eq('party_id', id)
    .eq('role', 'lessee');
  if (linksError) throw new Error(`Failed to load tenant contracts: ${linksError.message}`);

  const contractIds = (links ?? []).map((link) => link.contract_id);
  if (contractIds.length === 0) return okResponse({ tenant: party, contracts: [], installments: [], payments: [], maintenance: [] });

  const [contractsResult, installmentsResult, paymentsResult, maintenanceResult] = await Promise.all([
    supabase.from('lease_contracts').select('*, lease_contract_assets(asset_id, assets(name_ar,reference_number))').eq('tenant_id', caller.tenantId).in('id', contractIds).order('start_date', { ascending: false }),
    supabase.from('lease_installments').select('*').eq('tenant_id', caller.tenantId).in('contract_id', contractIds).order('due_date'),
    supabase.from('lease_payments').select('*').eq('tenant_id', caller.tenantId).in('contract_id', contractIds).order('paid_at', { ascending: false }),
    supabase.from('maintenance_requests').select('*, assets(name_ar,reference_number)').eq('tenant_id', caller.tenantId).in('contract_id', contractIds).order('opened_at', { ascending: false }),
  ]);

  if (contractsResult.error) throw new Error(`Failed to load contracts: ${contractsResult.error.message}`);
  if (installmentsResult.error) throw new Error(`Failed to load installments: ${installmentsResult.error.message}`);
  if (paymentsResult.error) throw new Error(`Failed to load payments: ${paymentsResult.error.message}`);
  if (maintenanceResult.error) throw new Error(`Failed to load maintenance: ${maintenanceResult.error.message}`);

  return okResponse({
    tenant: party,
    contracts: contractsResult.data ?? [],
    installments: installmentsResult.data ?? [],
    payments: paymentsResult.data ?? [],
    maintenance: maintenanceResult.data ?? [],
  });
});
