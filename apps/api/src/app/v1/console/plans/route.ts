import type { NextRequest } from 'next/server';
import { planInputSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

/**
 * console-only write side of plans (PRODUCT_SPEC section 2: price/limits
 * are console-managed data, never hardcoded). A public/authenticated read
 * endpoint exists separately at GET /v1/plans — RLS already makes plans
 * openly readable (plans_public_select), so gating reads here too would
 * fight the table's own security design rather than match it.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const { data, error } = await supabase.from('plans').select('*').order('price', { ascending: true });
  if (error) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }
  return okResponse({ plans: data });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await getPlatformAdminClient(request);
  const input = planInputSchema.parse(await request.json());

  const { data, error } = await supabase.from('plans').insert(input).select().single();
  if (error) {
    throw new Error(`Failed to create plan: ${error.message}`);
  }
  return okResponse({ plan: data }, 201);
});
