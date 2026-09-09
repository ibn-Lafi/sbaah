import type { NextRequest } from 'next/server';
import { subdomainInputSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwner } from '@/lib/auth/assert-owner';

/**
 * Lets the owner change the subdomain `generateUniqueSubdomain()`
 * auto-assigned at registration (apps/api/src/lib/tenant/subdomain.ts —
 * that file's own comment already flagged this as a future settings
 * feature). Owner-only, same tier as custom domain — both are ways
 * visitors reach the site, not day-to-day content.
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwner(caller.role);

  const { subdomain } = subdomainInputSchema.parse(await request.json());

  const { data, error } = await supabase
    .from('tenants')
    .update({ subdomain })
    .eq('id', caller.tenantId)
    .select('subdomain')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'subdomain_taken', 'هذا النطاق الفرعي مستخدَم بالفعل، اختر غيره');
    }
    throw new Error(`Failed to update subdomain: ${error.message}`);
  }

  return okResponse({ subdomain: data.subdomain });
});
