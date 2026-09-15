import type { PublicBrokerMarketerApplicationInput, PublicLeadInput } from '@sbaah/shared';
import { apiPost } from './client';

export function submitInquiry(input: PublicLeadInput) {
  return apiPost<{ status: string }>('/public/leads', input);
}

export function submitBrokerMarketerApplication(input: PublicBrokerMarketerApplicationInput) {
  return apiPost<{ status: string }>('/public/broker-marketer-applications', input);
}
