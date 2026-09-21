import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_WEBSITE_ASSET_SIZE_MB, MAX_WEBSITE_VIDEO_SIZE_MB } from '@sbaah/shared';
import { ApiError } from '@/lib/http';
import { safeExtensionFromMime } from '@/lib/storage/safe-extension';

const BUCKET = 'website-assets';
const BYTES_PER_MB = 1024 * 1024;

/**
 * Shared by POST /v1/website/logo, /v1/website/banner, and
 * /v1/website/banner-video — same upload + column-update shape, only the
 * target column, object filename, and expected mime family (image vs
 * video — only banner-video accepts video) differ.
 */
export async function uploadWebsiteAsset(
  supabase: SupabaseClient,
  tenantId: string,
  file: File,
  assetName: 'logo' | 'favicon' | 'banner' | 'banner-video',
  column: 'logo_url' | 'favicon_url' | 'banner_image_url' | 'banner_video_url',
) {
  const isVideoAsset = assetName === 'banner-video';
  const isFavicon = assetName === 'favicon';
  if (!file.type.startsWith(isVideoAsset ? 'video/' : 'image/')) {
    throw new ApiError(400, 'unsupported_file_type', isVideoAsset ? 'فيديو فقط مسموح' : 'صورة فقط مسموحة');
  }
  if (isFavicon && !['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(file.type)) {
    throw new ApiError(400, 'unsupported_favicon_type', 'صيغة أيقونة الموقع يجب أن تكون PNG أو JPG أو WebP أو ICO');
  }
  const maxSizeMb = isVideoAsset ? MAX_WEBSITE_VIDEO_SIZE_MB : isFavicon ? 1 : MAX_WEBSITE_ASSET_SIZE_MB;
  if (file.size > maxSizeMb * BYTES_PER_MB) {
    throw new ApiError(
      422,
      'file_too_large',
      `الحد الأقصى لحجم ${isVideoAsset ? 'الفيديو' : 'الصورة'} ${maxSizeMb} ميجابايت`,
    );
  }

  const extension = safeExtensionFromMime(file.type);
  const objectPath = `${tenantId}/${assetName}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: true });
  if (uploadError) {
    throw new Error(`Failed to upload website asset: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  // Cache-bust: `upsert` above overwrites the same object path, but a
  // browser (or Supabase's own CDN) would otherwise keep serving the old
  // cached image at that unchanged URL after a re-upload.
  const publicUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data, error } = await supabase
    .from('websites')
    .update({ [column]: publicUrl })
    .eq('tenant_id', tenantId)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to save website asset URL: ${error.message}`);
  }
  if (!data) {
    throw new Error('Website row missing for an existing tenant — check migration 0012');
  }

  return data;
}
