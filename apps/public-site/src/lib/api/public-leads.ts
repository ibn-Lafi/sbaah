import type { PublicBrokerMarketerApplicationInput, PublicLeadInput, PublicWhatsappClickInput } from '@sbaah/shared';
import { apiPost } from './client';

export function submitInquiry(input: PublicLeadInput) {
  return apiPost<{ status: string }>('/public/leads', input);
}

export function submitBrokerMarketerApplication(input: PublicBrokerMarketerApplicationInput) {
  return apiPost<{ status: string }>('/public/broker-applications', input);
}

/** Fire-and-forget from the WhatsApp button (task 34/42) — the caller doesn't await this before navigating to wa.me, a slow/failed log call should never block the visitor from actually chatting. */
export function logWhatsappClick(input: PublicWhatsappClickInput) {
  return apiPost<{ status: string }>('/public/whatsapp-click', input);
}
