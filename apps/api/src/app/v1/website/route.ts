import type { NextRequest } from 'next/server';
import { websiteUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const { data, error } = await supabase
    .from('websites')
    .select('*, website_sections(*)')
    .eq('tenant_id', caller.tenantId)
    .order('order_index', { foreignTable: 'website_sections' })
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load website: ${error.message}`);
  }
  if (!data) {
    // Every tenant gets a website automatically at registration (migration
    // 0012) — a missing row here means something went wrong at creation
    // time, not a normal "not found" a client should silently handle.
    throw new Error('Website row missing for an existing tenant — check migration 0012');
  }

  return okResponse({ website: data });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);

  const input = websiteUpdateSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('websites')
    .update(input)
    .eq('tenant_id', caller.tenantId)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update website: ${error.message}`);
  }
  if (!data) {
    throw new Error('Website row missing for an existing tenant — check migration 0012');
  }

  return okResponse({ website: data });
});
