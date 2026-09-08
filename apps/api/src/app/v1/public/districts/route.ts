import type { NextRequest } from 'next/server';
import { createAnonClient, districtListQuerySchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';

/**
 * Unauthenticated read of districts, optionally filtered by city_id — RLS
 * already makes `districts` openly readable (districts_public_select,
 * migration 0005). Writes are console-only (/v1/console/districts).
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { city_id } = districtListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));

  const supabase = createAnonClient();
  let query = supabase.from('districts').select('*');
  if (city_id) query = query.eq('city_id', city_id);

  const { data, error } = await query.order('name_ar', { ascending: true });
  if (error) {
    throw new Error(`Failed to list districts: ${error.message}`);
  }
  return okResponse({ districts: data });
});
