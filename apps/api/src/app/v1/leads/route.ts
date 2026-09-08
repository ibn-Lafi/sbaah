import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES, manualLeadInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const listQuerySchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.enum(LEAD_SOURCES).optional(),
  assigned_agent_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { status, source, assigned_agent_id, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('leads').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (assigned_agent_id) query = query.eq('assigned_agent_id', assigned_agent_id);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list leads: ${error.message}`);
  }

  return okResponse({ leads: data, page, page_size, total: count ?? 0 });
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
