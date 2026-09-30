import type { SupabaseClient } from '@supabase/supabase-js';

export type CreditType = 'whatsapp_message' | 'ai_agent';
export type CreditDirection = 'credit' | 'debit';

export interface CreditEntry {
  id: string;
  tenant_id: string;
  credit_type: CreditType;
  direction: CreditDirection;
  amount: number;
  balance_after: number;
  reason: string;
  idempotency_key: string;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function applyCreditEntry(input: {
  systemSupabase: SupabaseClient;
  tenantId: string;
  creditType: CreditType;
  direction: CreditDirection;
  amount: number;
  reason: string;
  idempotencyKey: string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<CreditEntry> {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error('Credit amount must be a positive safe integer');
  const { data, error } = await input.systemSupabase.rpc('apply_credit_entry', {
    p_tenant_id: input.tenantId,
    p_credit_type: input.creditType,
    p_direction: input.direction,
    p_amount: input.amount,
    p_reason: input.reason,
    p_idempotency_key: input.idempotencyKey,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
    p_metadata: input.metadata ?? {},
  });
  if (error) {
    if (error.message.includes('insufficient credits')) throw new Error(`Insufficient ${input.creditType} credits`);
    throw new Error(`Failed to apply credit entry: ${error.message}`);
  }
  return data as CreditEntry;
}

export async function getCreditBalances(input: { systemSupabase: SupabaseClient; tenantId: string }) {
  const { data, error } = await input.systemSupabase
    .from('credit_wallets')
    .select('credit_type,balance,lifetime_credited,lifetime_debited,updated_at')
    .eq('tenant_id', input.tenantId);
  if (error) throw new Error(`Failed to load credit balances: ${error.message}`);
  const byType = new Map((data ?? []).map((row) => [row.credit_type, row]));
  return {
    whatsapp_message: byType.get('whatsapp_message') ?? { credit_type: 'whatsapp_message', balance: 0, lifetime_credited: 0, lifetime_debited: 0, updated_at: null },
    ai_agent: byType.get('ai_agent') ?? { credit_type: 'ai_agent', balance: 0, lifetime_credited: 0, lifetime_debited: 0, updated_at: null },
  };
}
