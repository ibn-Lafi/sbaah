import type { City, CityInput, CityUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export function listCities(accessToken: string) {
  return apiGet<{ cities: City[] }>('/console/cities', accessToken);
}

export function createCity(accessToken: string, input: CityInput) {
  return apiPost<{ city: City }>('/console/cities', input, accessToken);
}

export function updateCity(accessToken: string, id: string, input: CityUpdateInput) {
  return apiPatch<{ city: City }>(`/console/cities/${id}`, input, accessToken);
}

export function deleteCity(accessToken: string, id: string) {
  return apiDelete<{ status: string }>(`/console/cities/${id}`, accessToken);
}
