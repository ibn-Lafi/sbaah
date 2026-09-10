import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwnerOrAdmin } from '@/lib/auth/assert-owner-or-admin';

/** Every other list endpoint (properties/leads/buildings/rentals/projects/console) takes page/page_size — this one didn't (code-quality audit finding). A generous default page_size keeps today's behavior unchanged for every real tenant (plans.max_users caps team size well below it) while still being consistent and bounded. */
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(200).default(100),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwnerOrAdmin(caller.role);

  const { page, page_size } = listQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const from = (page - 1) * page_size;

  const { data, error, count } = await supabase
    .from('users')
    .select('id, full_name, phone, role, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: true })
    .range(from, from + page_size - 1);
  if (error) {
    throw new Error(`Failed to load team members: ${error.message}`);
  }

  return okResponse({ members: data, page, page_size, total: count ?? 0 });
});
