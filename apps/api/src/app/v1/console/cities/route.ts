import type { NextRequest } from 'next/server';
import { cityInputSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/** console-only write side of cities — see /v1/console/plans/route.ts for why reads have a separate public endpoint instead of living here. */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('cities').select('*').order('name_ar', { ascending: true });
  if (error) {
    throw new Error(`Failed to list cities: ${error.message}`);
  }
  return okResponse({ cities: data });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const input = cityInputSchema.parse(await request.json());

  const { data, error } = await supabase.from('cities').insert(input).select().single();
  if (error) {
    throw new Error(`Failed to create city: ${error.message}`);
  }
  return okResponse({ city: data }, 201);
});
