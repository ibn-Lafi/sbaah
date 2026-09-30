import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { createServiceRoleClient } from '@sbaah/shared';
import { getCreditBalances } from '@/lib/ai/credits';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const systemSupabase = createServiceRoleClient();
  const balances = await getCreditBalances({ systemSupabase, tenantId: caller.tenantId });

  const { data: ledger, error } = await systemSupabase
    .from('credit_ledger')
    .select('id,credit_type,direction,amount,balance_after,reason,reference_type,reference_id,created_at')
    .eq('tenant_id', caller.tenantId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`Failed to load credit ledger: ${error.message}`);

  return okResponse({ balances, ledger: ledger ?? [] });
});
