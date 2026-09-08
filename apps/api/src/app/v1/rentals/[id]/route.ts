import { rentalUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase.from('rentals').select('*').eq('id', id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load rental: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'rental_not_found', 'الإيجار غير موجود');
  }

  return okResponse({ rental: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const input = rentalUpdateSchema.parse(await request.json());

  const { data, error } = await supabase.from('rentals').update(input).eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to update rental: ${error.message}`);
  }
  if (!data) {
    // Same as properties: RLS filtering a row out and the row genuinely
    // not existing look identical to the caller — no existence leak.
    throw new ApiError(404, 'rental_not_found', 'الإيجار غير موجود');
  }

  return okResponse({ rental: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase.from('rentals').delete().eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete rental: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'rental_not_found', 'الإيجار غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
