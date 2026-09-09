import type { District, DistrictInput, DistrictUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export function listDistricts(accessToken: string, cityId?: string) {
  const qs = cityId ? `?city_id=${cityId}` : '';
  return apiGet<{ districts: District[] }>(`/console/districts${qs}`, accessToken);
}

export function createDistrict(accessToken: string, input: DistrictInput) {
  return apiPost<{ district: District }>('/console/districts', input, accessToken);
}

export function updateDistrict(accessToken: string, id: string, input: DistrictUpdateInput) {
  return apiPatch<{ district: District }>(`/console/districts/${id}`, input, accessToken);
}

export function deleteDistrict(accessToken: string, id: string) {
  return apiDelete<{ status: string }>(`/console/districts/${id}`, accessToken);
}
