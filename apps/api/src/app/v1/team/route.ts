import type { NextRequest } from 'next/server';
import { okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertOwnerOrAdmin } from '@/lib/auth/assert-owner-or-admin';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);
  assertOwnerOrAdmin(caller.role);

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, phone, role, status, created_at')
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(`Failed to load team members: ${error.message}`);
  }

  return okResponse({ members: data });
});
