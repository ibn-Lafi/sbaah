import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { propertyInputSchema, PROPERTY_STATUSES } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const listQuerySchema = z.object({
  status: z.enum(PROPERTY_STATUSES).optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { status, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('properties').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list properties: ${error.message}`);
  }

  return okResponse({ properties: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  // RLS has no INSERT policy for agent at all on `properties` — reject
  // early with a clear error instead of a raw Postgres permission error.
  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة عقارات');
  }

  const input = propertyInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('properties')
    .insert({ ...input, tenant_id: caller.tenantId })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create property: ${error.message}`);
  }

  return okResponse({ property: data }, 201);
});
