import type { Rental, RentalInput, RentalStatus, RentalUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface RentalListResponse {
  rentals: Rental[];
  page: number;
  page_size: number;
  total: number;
}

export function listRentals(
  accessToken: string,
  params: { property_id?: string; status?: RentalStatus } = {},
): Promise<RentalListResponse> {
  const query = new URLSearchParams();
  if (params.property_id) query.set('property_id', params.property_id);
  if (params.status) query.set('status', params.status);
  const qs = query.toString();
  return apiGet<RentalListResponse>(`/rentals${qs ? `?${qs}` : ''}`, accessToken);
}

export function getRental(accessToken: string, id: string): Promise<{ rental: Rental }> {
  return apiGet<{ rental: Rental }>(`/rentals/${id}`, accessToken);
}

export function createRental(accessToken: string, input: RentalInput): Promise<{ rental: Rental }> {
  return apiPost<{ rental: Rental }>('/rentals', input, accessToken);
}

export function updateRental(accessToken: string, id: string, input: RentalUpdateInput): Promise<{ rental: Rental }> {
  return apiPatch<{ rental: Rental }>(`/rentals/${id}`, input, accessToken);
}

export function deleteRental(accessToken: string, id: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/rentals/${id}`, accessToken);
}
