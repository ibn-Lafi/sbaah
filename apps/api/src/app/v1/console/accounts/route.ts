import type { NextRequest } from 'next/server';
import { consoleAccountListQuerySchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/** console-only — lists every account on the platform (tenants_admin_write RLS grants this to a platform admin). */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { status, page, page_size } = consoleAccountListQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );

  let query = supabase.from('tenants').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);

  const from = (page - 1) * page_size;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to list accounts: ${error.message}`);
  }

  return okResponse({ accounts: data, page, page_size, total: count ?? 0 });
});
