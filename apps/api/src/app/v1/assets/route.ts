import type { NextRequest } from 'next/server';
import { assetInputSchema, assetSearchSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const input = assetSearchSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const { page, page_size, ...filters } = input;
  let query = supabase.from('assets').select('*', { count: 'exact' }).is('archived_at', null);
  for (const [key, value] of Object.entries(filters)) if (value != null) query = query.eq(key, value);
  const from = (page - 1) * page_size;
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + page_size - 1);
  if (error) throw new Error(`Failed to list assets: ${error.message}`);
  return okResponse({ assets: data, page, page_size, total: count ?? 0 });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  if (caller.role === 'agent') throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية إضافة عقارات');
  const input = assetInputSchema.parse(await request.json());
  const { data, error } = await supabase.from('assets').insert({ ...input, tenant_id: caller.tenantId }).select().single();
  if (error) throw new Error(`Failed to create asset: ${error.message}`);
  return okResponse({ asset: data }, 201);
});
