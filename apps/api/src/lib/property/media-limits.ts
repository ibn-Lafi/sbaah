import { MAX_IMAGES_PER_PROPERTY, MAX_VIDEOS_PER_PROPERTY, MAX_VIDEO_SIZE_MB } from '@sbaah/shared';
import type { MediaType } from '@sbaah/shared';

const BYTES_PER_MB = 1024 * 1024;

export interface MediaLimitCheck {
  ok: boolean;
  reason?: string;
}

/** Pure limit checks (PRODUCT_SPEC section 12) — no I/O, so the exact thresholds are unit-testable without a live upload. */
export function checkMediaLimits(
  mediaType: MediaType,
  fileSizeBytes: number,
  existingCounts: { images: number; videos: number },
): MediaLimitCheck {
  if (mediaType === 'video') {
    if (fileSizeBytes > MAX_VIDEO_SIZE_MB * BYTES_PER_MB) {
      return { ok: false, reason: `الفيديو أكبر من الحد الأقصى (${MAX_VIDEO_SIZE_MB} ميجابايت)` };
    }
    if (existingCounts.videos >= MAX_VIDEOS_PER_PROPERTY) {
      return { ok: false, reason: `الحد الأقصى ${MAX_VIDEOS_PER_PROPERTY} فيديو لكل عقار` };
    }
    return { ok: true };
  }

  if (existingCounts.images >= MAX_IMAGES_PER_PROPERTY) {
    return { ok: false, reason: `الحد الأقصى ${MAX_IMAGES_PER_PROPERTY} صورة لكل عقار` };
  }
  return { ok: true };
}
