import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_WEBSITE_ASSET_SIZE_MB } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

const BUCKET = 'website-assets';
const BYTES_PER_MB = 1024 * 1024;

/**
 * Shared by POST /v1/website/logo and /v1/website/banner — same upload +
 * column-update shape, only the target column and object filename differ.
 * Images only (logo/banner are never video, unlike property media).
 */
export async function uploadWebsiteAsset(
  supabase: SupabaseClient,
  tenantId: string,
  file: File,
  assetName: 'logo' | 'banner',
  column: 'logo_url' | 'banner_image_url',
) {
  if (!file.type.startsWith('image/')) {
    throw new ApiError(400, 'unsupported_file_type', 'صورة فقط مسموحة');
  }
  if (file.size > MAX_WEBSITE_ASSET_SIZE_MB * BYTES_PER_MB) {
    throw new ApiError(422, 'file_too_large', `الحد الأقصى لحجم الصورة ${MAX_WEBSITE_ASSET_SIZE_MB} ميجابايت`);
  }

  const extension = file.name.split('.').pop() ?? 'bin';
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
