import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '@/lib/http';

type TenantOwnedTable = 'users' | 'properties' | 'projects' | 'buildings' | 'leads';

interface AssertTenantOwnedRowOptions {
  supabase: SupabaseClient;
  table: TenantOwnedTable;
  id: string;
  tenantId: string;
  label?: string;
}

/**
 * Validates foreign-key targets before writes. RLS remains the final data-layer
 * boundary; this helper gives deterministic API errors and prevents accidentally
 * linking a tenant-owned row to an ID supplied from another tenant.
 */
export async function assertTenantOwnedRow({
  supabase,
  table,
  id,
  tenantId,
  label = 'السجل المرتبط',
}: AssertTenantOwnedRowOptions): Promise<void> {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to validate tenant ownership for ${table}: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(400, 'invalid_tenant_reference', `${label} غير موجود أو لا يتبع نفس الحساب`);
  }
}

export async function assertOptionalTenantOwnedRow(
  options: Omit<AssertTenantOwnedRowOptions, 'id'> & { id?: string | null },
): Promise<void> {
  if (!options.id) return;
  await assertTenantOwnedRow({ ...options, id: options.id });
}
