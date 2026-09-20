import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  if (!tenantId) throw new ApiError(400, 'tenant_id_required', 'tenant_id is required');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('public_listing_feed', {
    p_tenant_id: tenantId,
    p_limit: 50,
    p_offset: 0,
  });
  if (error) throw new Error(`Failed to load public listings: ${error.message}`);
  return okResponse({ listings: data ?? [] });
});
