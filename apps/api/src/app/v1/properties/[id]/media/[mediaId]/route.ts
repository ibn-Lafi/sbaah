import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';

interface RouteContext {
  params: Promise<{ id: string; mediaId: string }>;
}

const BUCKET = 'property-media';

export const DELETE = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id: propertyId, mediaId } = await params;
  const { supabase } = getAuthenticatedClient(request);

  const { data: mediaRow, error: fetchError } = await supabase
    .from('property_media')
    .select('id, url')
    .eq('id', mediaId)
    .eq('property_id', propertyId)
    .maybeSingle();
  if (fetchError) {
    throw new Error(`Failed to load media before delete: ${fetchError.message}`);
  }
  if (!mediaRow) {
    throw new ApiError(404, 'media_not_found', 'الوسائط غير موجودة');
  }

  const { error: deleteError } = await supabase.from('property_media').delete().eq('id', mediaId);
  if (deleteError) {
    throw new Error(`Failed to delete media row: ${deleteError.message}`);
  }

  const objectPath = new URL(mediaRow.url).pathname.split(`/${BUCKET}/`)[1];
  if (objectPath) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
  }

  return okResponse({ status: 'deleted' });
});
