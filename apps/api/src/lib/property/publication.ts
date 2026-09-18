import { ApiError } from '@/lib/http';

export interface PublicationCandidate {
  advertisement_license_number?: string | null;
  advertisement_license_expires_at?: string | null;
}

/**
 * Product publication gate. This validates Sabaah's configured publication
 * metadata; it is not a claim that these fields exhaust Saudi legal duties.
 */
export function assertPropertyPublishable(candidate: PublicationCandidate): void {
  if (!candidate.advertisement_license_number?.trim()) {
    throw new ApiError(422, 'publication_blocked', 'أضف رقم ترخيص الإعلان قبل النشر');
  }
  if (!candidate.advertisement_license_expires_at) {
    throw new ApiError(422, 'publication_blocked', 'أضف تاريخ انتهاء ترخيص الإعلان قبل النشر');
  }
  if (new Date(candidate.advertisement_license_expires_at).getTime() <= Date.now()) {
    throw new ApiError(422, 'publication_blocked', 'ترخيص الإعلان منتهي ولا يمكن نشر العقار');
  }
}
