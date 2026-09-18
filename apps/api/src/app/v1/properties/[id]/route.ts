import { propertyUpdateSchema } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { assertPropertyPublishable } from '@/lib/property/publication';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export const GET = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data, error } = await supabase
    .from('properties')
    .select('*, property_media(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load property: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
  }

  return okResponse({ property: data });
});

export const PATCH = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const input = propertyUpdateSchema.parse(await request.json());

  if (input.status === 'published') {
    const { data: current, error: currentError } = await supabase
      .from('properties')
      .select('advertisement_license_number, advertisement_license_expires_at')
      .eq('id', id)
      .maybeSingle();
    if (currentError) throw new Error(`Failed to validate publication: ${currentError.message}`);
    if (!current) throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
    assertPropertyPublishable({ ...current, ...input });
  }

  const updatePayload = input.status === 'published'
    ? { ...input, publication_state: 'published' }
    : input.status === 'draft'
      ? { ...input, publication_state: 'draft' }
      : input;

  const { data, error } = await supabase
    .from('properties')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }
  if (!data) {
    // RLS filtered the row out (not found, or no write access) — same
    // 404 either way, so we never reveal whether a property exists in
    // another tenant.
    throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
  }

  return okResponse({ property: data });
});

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  if (caller.role === 'agent') {
    throw new ApiError(403, 'forbidden', 'لا يملك الوسيط صلاحية حذف عقارات');
  }

  const { data, error } = await supabase.from('properties').delete().eq('id', id).select().maybeSingle();
  if (error) {
    throw new Error(`Failed to delete property: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
  }

  return okResponse({ status: 'deleted' });
});
