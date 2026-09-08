import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { projectInputSchema, PROPERTY_STATUSES } from '@sbaah/shared';
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

  let query = supabase.from('projects').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list projects: ${error.message}`);
  }

  return okResponse({ projects: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  // No agent INSERT policy on `projects` at all (migration 0009) — agents
  // only read, for context on which project/building a unit belongs to.
  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إدارة المشاريع');
  }

  const input = projectInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...input, tenant_id: caller.tenantId })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return okResponse({ project: data }, 201);
});
