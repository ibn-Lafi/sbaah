import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES, manualLeadInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPermission } from '@/lib/auth/permissions';
import { isAssignedScope } from '@/lib/auth/crm-scope';
import { assertOptionalTenantOwnedRow } from '@/lib/tenant/assert-tenant-owned-row';

const listQuerySchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_agent_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
  customer_kind: z.enum(['customer', 'prospect']).optional(),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const grant = assertPermission(caller.role, 'crm.read');
  const { status, source, assigned_agent_id, page, page_size, customer_kind } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('leads').select('*', { count: 'exact' }).eq('tenant_id', caller.tenantId);
  if (isAssignedScope(grant)) query = query.eq('assigned_agent_id', caller.userId);
  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (assigned_agent_id && !isAssignedScope(grant)) query = query.eq('assigned_agent_id', assigned_agent_id);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to list leads: ${error.message}`);

  const leadRows = data ?? [];
  let customerLeadIds = new Set<string>();

  if (leadRows.length > 0) {
    const leadIds = leadRows.map((lead) => lead.id);
    const [wonDealsResult, partiesResult] = await Promise.all([
      supabase.from('deals').select('lead_id').eq('tenant_id', caller.tenantId).eq('status', 'won').in('lead_id', leadIds),
      supabase.from('parties').select('id, lead_id').eq('tenant_id', caller.tenantId).in('lead_id', leadIds),
    ]);
    if (wonDealsResult.error) throw new Error(`Failed to classify purchased customers: ${wonDealsResult.error.message}`);
    if (partiesResult.error) throw new Error(`Failed to classify rental customers: ${partiesResult.error.message}`);

    const parties = partiesResult.data ?? [];
    const partyIds = parties.map((party) => party.id);
    let rentedPartyIds = new Set<string>();
    if (partyIds.length > 0) {
      const { data: contractLinks, error: contractLinksError } = await supabase
        .from('lease_contract_parties')
        .select('party_id')
        .eq('tenant_id', caller.tenantId)
        .in('party_id', partyIds)
        .eq('role', 'lessee');
      if (contractLinksError) throw new Error(`Failed to classify rental contracts: ${contractLinksError.message}`);
      rentedPartyIds = new Set((contractLinks ?? []).map((link) => link.party_id));
    }

    customerLeadIds = new Set([
      ...(wonDealsResult.data ?? []).map((deal) => deal.lead_id),
      ...parties.filter((party) => rentedPartyIds.has(party.id)).map((party) => party.lead_id),
    ].filter(Boolean));
  }

  const classified = leadRows.map((lead) => ({ ...lead, customer_kind: lead.customer_relationship || customerLeadIds.has(lead.id) ? 'customer' : 'prospect' }));
  const filtered = customer_kind ? classified.filter((lead) => lead.customer_kind === customer_kind) : classified;
  const from = (page - 1) * page_size;
  const paged = filtered.slice(from, from + page_size);

  return okResponse({ leads: paged, page, page_size, total: filtered.length });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  // No agent INSERT policy on `leads` (migration 0005) — staff-entered
  // leads (source='manual') are an Owner/Admin action, e.g. logging a
  // walk-in. Agents work leads assigned to them, not add new ones.
  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة عملاء محتملين يدويًا');
  }

  const input = manualLeadInputSchema.parse(await request.json());

  await assertOptionalTenantOwnedRow({
    supabase,
    table: 'assets',
    id: input.asset_id,
    tenantId: caller.tenantId,
    label: 'العقار',
  });
  await assertOptionalTenantOwnedRow({ supabase, table: 'listings', id: input.listing_id, tenantId: caller.tenantId, label: 'العرض العقاري' });
  await assertOptionalTenantOwnedRow({
    supabase,
    table: 'users',
    id: input.assigned_agent_id,
    tenantId: caller.tenantId,
    label: 'الموظف المسند إليه العميل',
  });

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...input, tenant_id: caller.tenantId, source: 'manual' })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return okResponse({ lead: data }, 201);
});
