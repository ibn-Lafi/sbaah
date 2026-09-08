import type { Property, PropertyInput, PropertyMedia, PropertyStatus, PropertyUpdateInput } from '@sbaah/shared';
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from './client';

export interface PropertyListResponse {
  properties: Property[];
  page: number;
  page_size: number;
  total: number;
}

export function listProperties(
  accessToken: string,
  params: { status?: PropertyStatus; page?: number } = {},
): Promise<PropertyListResponse> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  const qs = query.toString();
  return apiGet<PropertyListResponse>(`/properties${qs ? `?${qs}` : ''}`, accessToken);
}

export type PropertyWithMedia = Property & { property_media: PropertyMedia[] };

export function getProperty(accessToken: string, id: string): Promise<{ property: PropertyWithMedia }> {
  return apiGet<{ property: PropertyWithMedia }>(`/properties/${id}`, accessToken);
}

export function createProperty(accessToken: string, input: PropertyInput): Promise<{ property: Property }> {
  return apiPost<{ property: Property }>('/properties', input, accessToken);
}

export function updateProperty(
  accessToken: string,
  id: string,
  input: PropertyUpdateInput,
): Promise<{ property: Property }> {
  return apiPatch<{ property: Property }>(`/properties/${id}`, input, accessToken);
}

export function deleteProperty(accessToken: string, id: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/properties/${id}`, accessToken);
}

export function uploadPropertyMedia(
  accessToken: string,
  propertyId: string,
  file: File,
): Promise<{ media: PropertyMedia }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiUpload<{ media: PropertyMedia }>(`/properties/${propertyId}/media`, formData, accessToken);
}

export function deletePropertyMedia(accessToken: string, propertyId: string, mediaId: string): Promise<{ status: string }> {
  return apiDelete<{ status: string }>(`/properties/${propertyId}/media/${mediaId}`, accessToken);
}
