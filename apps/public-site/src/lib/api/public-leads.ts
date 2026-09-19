import type { PublicLeadInput } from '@sbaah/shared';
import { apiPost } from './client';

export function submitInquiry(input: PublicLeadInput) {
  return apiPost<{ status: string }>('/public/leads', input);
}
