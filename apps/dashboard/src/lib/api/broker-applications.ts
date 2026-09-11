import type { BrokerMarketerApplicantType, BrokerMarketerApplication } from '@sbaah/shared';
import { apiGet } from './client';

export type BrokerMarketerApplicationWithRelations = BrokerMarketerApplication & {
  cities: { name_ar: string; name_en: string } | null;
  properties: { id: string; title_ar: string; title_en: string } | null;
};

export interface BrokerMarketerApplicationListResponse {
  applications: BrokerMarketerApplicationWithRelations[];
  page: number;
  page_size: number;
  total: number;
}

export function listBrokerMarketerApplications(
  accessToken: string,
  params: { applicant_type?: BrokerMarketerApplicantType; property_id?: string; page?: number } = {},
): Promise<BrokerMarketerApplicationListResponse> {
  const query = new URLSearchParams();
  if (params.applicant_type) query.set('applicant_type', params.applicant_type);
  if (params.property_id) query.set('property_id', params.property_id);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiGet<BrokerMarketerApplicationListResponse>(`/broker-applications${qs ? `?${qs}` : ''}`, accessToken);
}
