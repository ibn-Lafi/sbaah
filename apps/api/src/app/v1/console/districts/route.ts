import type { NextRequest } from 'next/server';
import { districtInputSchema, districtListQuerySchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/** console-only write side of districts — see /v1/console/plans/route.ts for why reads have a separate public endpoint instead of living here. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { city_id } = districtListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  let query = supabase.from('districts').select('*');
  if (city_id) query = query.eq('city_id', city_id);

  const { data, error } = await query.order('name_ar', { ascending: true });
  if (error) {
    throw new Error(`Failed to list districts: ${error.message}`);
  }
  return okResponse({ districts: data });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const input = districtInputSchema.parse(await request.json());

  const { data, error } = await supabase.from('districts').insert(input).select().single();
  if (error) {
    // city_id references cities(id) — a nonexistent city fails the FK.
    if (error.code === '23503') {
      throw new ApiError(400, 'invalid_city', 'المدينة المحددة غير موجودة');
    }
    throw new Error(`Failed to create district: ${error.message}`);
  }
  return okResponse({ district: data }, 201);
});
