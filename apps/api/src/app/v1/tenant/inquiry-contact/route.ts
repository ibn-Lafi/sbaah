import type { NextRequest } from 'next/server';
import { createServiceRoleClient, inquiryContactUpdateSchema } from '@sbaah/shared';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertNotAgent } from '@/lib/auth/assert-not-agent';
import { assertTenantActive } from '@/lib/tenant/assert-tenant-active';

const COLUMNS = 'inquiry_email, inquiry_phone';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  const { data, error } = await supabase.from('tenants').select(COLUMNS).eq('id', caller.tenantId).single();
  if (error || !data) throw new Error(`Failed to load inquiry contact: ${error?.message}`);
  return okResponse(data);
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertNotAgent(caller.role);
  const input = inquiryContactUpdateSchema.parse(await request.json());
  const serviceRole = createServiceRoleClient();
  await assertTenantActive(serviceRole, caller.tenantId);
  const { data, error } = await serviceRole.from('tenants').update(input).eq('id', caller.tenantId).select(COLUMNS).single();
  if (error || !data) throw new Error(`Failed to update inquiry contact: ${error?.message}`);
  return okResponse(data);
});
