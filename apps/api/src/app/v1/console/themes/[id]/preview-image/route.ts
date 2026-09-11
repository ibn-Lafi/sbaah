import { ApiError, okResponse, withErrorHandling } from '@/lib/http';
import { getPlatformAdminClient } from '@/lib/auth/get-platform-admin-client';

const BUCKET = 'theme-assets';
const MAX_SIZE_MB = 5;
const BYTES_PER_MB = 1024 * 1024;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * صورة معاينة الثيم بمتجر الثيمات (migration 0035) — platform-admin only,
 * نفس نمط uploadWebsiteAsset لكن غير مرتبط بمستأجر: المسار
 * {theme_id}/preview.{ext} بلا مجلد tenant_id.
 */
export const POST = withErrorHandling<RouteContext>(async (request, { params }) => {
  const { id } = await params;
  const { supabase } = await getPlatformAdminClient(request);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ApiError(400, 'file_required', 'الملف مطلوب');
  }
  if (!file.type.startsWith('image/')) {
    throw new ApiError(400, 'unsupported_file_type', 'صورة فقط مسموحة');
  }
  if (file.size > MAX_SIZE_MB * BYTES_PER_MB) {
    throw new ApiError(422, 'file_too_large', `الحد الأقصى لحجم الصورة ${MAX_SIZE_MB} ميجابايت`);
  }

  const extension = file.name.split('.').pop() ?? 'bin';
  const objectPath = `${id}/preview.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: true });
  if (uploadError) {
    throw new Error(`Failed to upload theme preview image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  // Cache-bust: `upsert` overwrites the same object path, but the CDN/browser
  // would otherwise keep serving the old cached image at that unchanged URL.
  const previewImageUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data, error } = await supabase
    .from('themes')
    .update({ preview_image_url: previewImageUrl })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to save theme preview image URL: ${error.message}`);
  }
  if (!data) {
    throw new ApiError(404, 'theme_not_found', 'الثيم غير موجود');
  }

  return okResponse({ theme: data });
});
