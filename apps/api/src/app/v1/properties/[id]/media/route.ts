import type { MediaType } from '@sbaah/shared';
import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getAuthenticatedClient } from '@/lib/auth/get-authenticated-client';
import { getCallerContext } from '@/lib/auth/get-caller-context';
import { checkMediaLimits } from '@/lib/property/media-limits';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const BUCKET = 'property-media';

function mediaTypeFromMime(mime: string): MediaType | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id: propertyId } = await params;
  const { supabase } = getAuthenticatedClient(request);
  const caller = await getCallerContext(supabase);

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .maybeSingle();
  if (propertyError) {
    throw new Error(`Failed to load property for media upload: ${propertyError.message}`);
  }
  if (!property) {
    // RLS already denies this to an agent whose own property it isn't —
    // same 404 as a genuinely missing property, no existence leak.
    throw new ApiError(404, 'property_not_found', 'العقار غير موجود');
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ApiError(400, 'file_required', 'الملف مطلوب');
  }

  const mediaType = mediaTypeFromMime(file.type);
  if (!mediaType) {
    throw new ApiError(400, 'unsupported_file_type', 'نوع الملف غير مدعوم — صورة أو فيديو فقط');
  }

  const { data: existingMedia, error: existingError } = await supabase
    .from('property_media')
    .select('media_type, order_index')
    .eq('property_id', propertyId);
  if (existingError) {
    throw new Error(`Failed to check existing media: ${existingError.message}`);
  }

  const counts = {
    images: existingMedia?.filter((m) => m.media_type === 'image').length ?? 0,
    videos: existingMedia?.filter((m) => m.media_type === 'video').length ?? 0,
  };
  const limitCheck = checkMediaLimits(mediaType, file.size, counts);
  if (!limitCheck.ok) {
    throw new ApiError(422, 'media_limit_exceeded', limitCheck.reason ?? 'تجاوزت الحد المسموح');
  }

  const extension = file.name.split('.').pop() ?? 'bin';
  const objectPath = `${caller.tenantId}/${propertyId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    contentType: file.type,
  });
  if (uploadError) {
    throw new Error(`Failed to upload media to storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const nextOrderIndex = Math.max(-1, ...(existingMedia?.map((m) => m.order_index) ?? [-1])) + 1;

  const { data: mediaRow, error: insertError } = await supabase
    .from('property_media')
    .insert({
      property_id: propertyId,
      media_type: mediaType,
      url: publicUrlData.publicUrl,
      order_index: nextOrderIndex,
    })
    .select()
    .single();
  if (insertError) {
    // Compensate: the file is already in storage but has no DB row —
    // remove it rather than leaving an orphaned object.
    await supabase.storage.from(BUCKET).remove([objectPath]);
    throw new Error(`Failed to record uploaded media: ${insertError.message}`);
  }

  return okResponse({ media: mediaRow }, 201);
});
