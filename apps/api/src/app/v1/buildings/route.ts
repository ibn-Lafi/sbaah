import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { buildingInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

const listQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(50).default(20),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const { project_id, page, page_size } = listQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('buildings').select('*', { count: 'exact' });
  if (project_id) query = query.eq('project_id', project_id);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list buildings: ${error.message}`);
  }

  return okResponse({ buildings: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إدارة العمارات');
  }

  const input = buildingInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('buildings')
    .insert({ ...input, tenant_id: caller.tenantId })
    .select()
    .single();
  if (error) {
    throw new Error(`Failed to create building: ${error.message}`);
  }

  return okResponse({ building: data }, 201);
});
