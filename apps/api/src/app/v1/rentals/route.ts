import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { rentalInputSchema, RENTAL_STATUSES } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const listQuerySchema = z.object({
  property_id: z.string().uuid().optional(),
  status: z.enum(RENTAL_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { property_id, status, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('rentals').select('*', { count: 'exact' });
  if (property_id) query = query.eq('property_id', property_id);
  if (status) query = query.eq('status', status);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list rentals: ${error.message}`);
  }

  return okResponse({ rentals: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const input = rentalInputSchema.parse(await request.json());

  // Unlike properties/projects/buildings, an Agent CAN create rentals —
  // only for properties assigned to them, enforced by
  // rentals_agent_manage's WITH CHECK (migration 0009). No early role
  // rejection here; a mismatched property_id fails naturally via RLS
  // and surfaces as the generic insert error below.
  const { data, error } = await supabase
    .from('rentals')
    .insert({ ...input, tenant_id: caller.tenantId })
    .select()
    .single();
  if (error) {
    // Postgres 42501 = row-level security violation — an Agent tried to
    // create a rental against a property that isn't assigned to them.
    // A clean 403 beats a raw 500 for a case this plausible.
    if (error.code === '42501') {
      throw new ApiError(403, 'forbidden', 'لا يمكنك إضافة إيجار لعقار غير مسند إليك');
    }
    throw new Error(`Failed to create rental: ${error.message}`);
  }

  return okResponse({ rental: data }, 201);
});
